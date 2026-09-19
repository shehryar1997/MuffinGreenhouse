import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import * as Sentry from "@sentry/nextjs"
import { checkRateLimit } from "@/lib/rate-limit"
import { supabaseAdmin } from "@/supabase/admin-client"
import { createServerClient } from "@/lib/supabase/server-client"
import { sendOrderConfirmationEmail } from "@/lib/email/send-order-confirmation"
import { pakistanCities } from "@/data/pakistan-cities"
import { calculateDeliveryFee, type DeliveryFeeDimensions } from "@/lib/delivery-fee"
import type { PaymentSummary } from "@/lib/checkout-summary"

/**
 * CHECKOUT SUBMIT ENDPOINT
 *
 * Creates an order via the Supabase RPC `create_order` (stock locking,
 * validation and insertion happen atomically inside it).
 *
 * Everything that affects the amount charged is decided HERE, never taken from
 * the browser: line prices come from the database (inside the RPC), the
 * delivery fee is recomputed from product weights/dimensions and the delivery
 * city, and no discount can be supplied. The customer identity comes from the
 * verified Supabase session (or the guest e-mail), and a saved address must
 * belong to that customer.
 *
 * Rate limiting is applied via checkRateLimit (5 requests/minute per IP).
 */

const PAYMENT_METHODS = ["card", "bank_transfer", "jazzcash", "easypaisa", "nayapay", "zindigi", "raast"] as const

const uuid = z.string().uuid()

const checkoutSchema = z.object({
  customerEmail: z.string().trim().toLowerCase().email().max(254).nullish(),
  customerName: z.string().trim().max(120).nullish(),
  customerPhone: z.string().trim().max(32).nullish(),
  items: z
    .array(
      z.object({
        productId: uuid,
        variantId: uuid.nullish(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(50),
  deliveryType: z.enum(["delivery", "pickup"]),
  addressId: uuid.nullish(),
  newAddress: z
    .object({
      fullAddress: z.string().trim().min(5).max(500),
      city: z.string().trim().min(1).max(100),
    })
    .nullish(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  customerNotes: z.string().trim().max(1000).nullish(),
})

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return jsonError("Invalid request body", 400)
    }

    const parsed = checkoutSchema.safeParse(raw)
    if (!parsed.success) {
      const cartProblem = parsed.error.issues.some((issue) => issue.path[0] === "items")
      return jsonError(cartProblem ? "Your cart is empty or contains invalid items" : "Invalid order details. Please check your information and try again.", 400)
    }
    const body = parsed.data

    // ------------------------------------------------------------------
    // Who is ordering? Trust the verified session, never a customerId from the body.
    // ------------------------------------------------------------------
    let sessionCustomer: { id: string; email: string; name: string | null; phone: string | null } | null = null
    try {
      const cookieStore = await cookies()
      const supabase = createServerClient(cookieStore)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabaseAdmin
          .from("customers")
          .select("id, email, name, phone")
          .eq("auth_id", user.id)
          .maybeSingle()
        sessionCustomer = data
      }
    } catch (authError) {
      // No/invalid session cookie: treat as a guest.
      console.warn("Checkout: could not resolve session", authError)
    }

    let customerId: string
    const customerEmail = sessionCustomer?.email ?? body.customerEmail ?? null
    const customerName = body.customerName || sessionCustomer?.name || null
    const customerPhone = body.customerPhone || sessionCustomer?.phone || null

    if (sessionCustomer) {
      customerId = sessionCustomer.id
    } else {
      if (!customerEmail) {
        return jsonError("Customer email is required for guest checkout", 400)
      }

      // Resolve the customer up front (rather than letting the RPC upsert it),
      // because a manually-entered address needs a customer_id to attach to
      // BEFORE create_order runs.
      const { data: existingCustomer, error: lookupError } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("email", customerEmail)
        .maybeSingle()

      if (lookupError) {
        console.error("Failed to look up customer:", lookupError)
        return jsonError("Failed to process customer information", 500)
      }

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        const { data: newCustomer, error: customerError } = await supabaseAdmin
          .from("customers")
          .insert({ email: customerEmail, name: customerName, phone: customerPhone })
          .select("id")
          .single()

        if (customerError || !newCustomer) {
          console.error("Failed to create customer:", customerError)
          return jsonError("Failed to process customer information", 500)
        }
        customerId = newCustomer.id
      }
    }

    // ------------------------------------------------------------------
    // Delivery address. The `orders` table only stores an address_id, so a
    // manually-entered address has to become a real `addresses` row first.
    // A saved address must belong to THIS customer.
    // ------------------------------------------------------------------
    let addressId: string | null = null
    let deliveryCity: string | null = null

    if (body.deliveryType === "delivery") {
      if (body.addressId) {
        const { data: savedAddress, error: addressLookupError } = await supabaseAdmin
          .from("addresses")
          .select("id, city")
          .eq("id", body.addressId)
          .eq("customer_id", customerId)
          .eq("is_active", true)
          .maybeSingle()

        if (addressLookupError) {
          console.error("Failed to look up address:", addressLookupError)
          return jsonError("Failed to load delivery address", 500)
        }
        if (!savedAddress) {
          return jsonError("The selected delivery address could not be found. Please choose or enter another one.", 400)
        }
        addressId = savedAddress.id
        deliveryCity = savedAddress.city
      } else if (body.newAddress) {
        const newAddressCity = body.newAddress.city
        const province = pakistanCities.find((c) => c.name === newAddressCity)?.province || newAddressCity

        const { count: existingAddressCount } = await supabaseAdmin
          .from("addresses")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", customerId)

        const { data: newAddress, error: addressError } = await supabaseAdmin
          .from("addresses")
          .insert({
            customer_id: customerId,
            label: "Checkout Address",
            street: body.newAddress.fullAddress,
            city: newAddressCity,
            province,
            phone: customerPhone,
            is_default: (existingAddressCount ?? 0) === 0,
          })
          .select("id")
          .single()

        if (addressError || !newAddress) {
          console.error("Failed to save delivery address:", addressError)
          return jsonError("Failed to save delivery address", 500)
        }
        addressId = newAddress.id
        deliveryCity = newAddressCity
      } else {
        return jsonError("A delivery address is required", 400)
      }
    }

    // ------------------------------------------------------------------
    // Delivery fee: recomputed on the server.
    // ------------------------------------------------------------------
    let deliveryFee = 0
    if (body.deliveryType === "delivery") {
      const productIds = [...new Set(body.items.map((item) => item.productId))]
      const { data: productRows, error: productError } = await supabaseAdmin
        .from("products")
        .select("id, box_height_cm, box_width_cm, box_breadth_cm, category_slug, weight_kg")
        .in("id", productIds)

      if (productError) {
        console.error("Failed to load products for delivery fee:", productError)
        return jsonError("Failed to calculate delivery fee", 500)
      }

      const dimensionsById = new Map<string, DeliveryFeeDimensions>(
        (productRows ?? []).map((row) => [
          row.id,
          {
            categorySlug: row.category_slug,
            boxHeightCm: row.box_height_cm,
            boxWidthCm: row.box_width_cm,
            boxBreadthCm: row.box_breadth_cm,
            weightKg: row.weight_kg,
          },
        ])
      )

      deliveryFee = calculateDeliveryFee({
        deliveryType: body.deliveryType,
        city: deliveryCity,
        items: body.items.map((item) => ({ dim: dimensionsById.get(item.productId), quantity: item.quantity })),
      })
    }

    // Convert items to JSONB format expected by the RPC
    const itemsJsonb = body.items.map((item) => ({
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      quantity: item.quantity,
    }))

    // Call the create_order RPC function using service role client (bypasses RLS)
    const { data, error } = await supabaseAdmin.rpc("create_order", {
      p_customer_id: customerId,
      p_customer_email: customerEmail,
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_items: itemsJsonb,
      p_delivery_type: body.deliveryType,
      p_address_id: addressId,
      p_payment_method: body.paymentMethod,
      p_delivery_fee: deliveryFee,
      p_discount_amount: 0,
      p_customer_notes: body.customerNotes || null,
    })

    if (error) {
      console.error("RPC create_order error:", error)

      // Handle specific error messages from the RPC
      let errorMessage = "Failed to create order"
      let statusCode = 500

      if (error.message.includes("insufficient stock") || error.message.includes("Insufficient stock")) {
        errorMessage = "Some items in your cart are no longer available in the requested quantity. Please review your cart."
        statusCode = 409 // Conflict
      } else if (error.message.includes("not found") || error.message.includes("does not exist")) {
        errorMessage = "One or more products in your cart could not be found. Please refresh your cart."
        statusCode = 404
      } else if (error.message.includes("validation") || error.message.includes("invalid")) {
        errorMessage = "Invalid order data. Please check your information and try again."
        statusCode = 400
      } else {
        Sentry.captureException(error)
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: statusCode }
      )
    }

    // create_order only returns { order_id, order_number, customer_id, total }.
    const orderId: string = data.order_id
    const orderNumber: string = data.order_number
    const total = Number(data.total) || 0
    const subtotal = total - deliveryFee

    // Order lines exactly as stored (DB prices), used for the confirmation
    // email and for the payment page summary.
    const { data: orderItems, error: orderItemsError } = await supabaseAdmin
      .from("order_items")
      .select("product_id, product_name, quantity, unit_price")
      .eq("order_id", orderId)

    if (orderItemsError) {
      console.error("Failed to fetch order items:", orderItemsError)
    }

    const summaryItems = (orderItems ?? []).map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      price: Number(item.unit_price),
    }))

    // Fire-and-forget order confirmation email
    // ponytail: Non-blocking - email failure shouldn't fail the order
    if (customerEmail && orderItems) {
      sendOrderConfirmationEmail({
        toEmail: customerEmail,
        customerName,
        orderNumber: orderNumber?.toString() ?? orderId,
        orderId: orderId.toString(),
        items: summaryItems.map(({ productName, quantity, price }) => ({ productName, quantity, price })),
        subtotal,
        deliveryFee,
        total,
        deliveryType: body.deliveryType,
        paymentMethod: body.paymentMethod,
      }).catch((err) => {
        console.error("Failed to send order confirmation email:", err)
      })
    }

    // The payment page gets its details from this object (via sessionStorage),
    // NOT from the URL: keeps name/email out of history, logs and analytics.
    const summary: PaymentSummary = {
      orderId,
      orderNumber,
      total,
      customerEmail: customerEmail ?? "",
      customerName: customerName ?? "",
      items: summaryItems,
      deliveryType: body.deliveryType,
      deliveryFee,
      subtotal,
    }

    return NextResponse.json(
      {
        success: true,
        order: data,
        summary,
        redirectTo: `/checkout/pay?orderNumber=${encodeURIComponent(orderNumber)}`,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error("Checkout submission error:", err)
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        error: "An unexpected error occurred while processing your order",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    )
  }
}
