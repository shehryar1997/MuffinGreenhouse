import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { supabaseAdmin } from "@/supabase/admin-client"
import { sendOrderConfirmationEmail } from "@/lib/email/send-order-confirmation"
import { pakistanCities } from "@/data/pakistan-cities"
import * as Sentry from "@sentry/nextjs"

/**
 * CHECKOUT SUBMIT ENDPOINT
 * 
 * This endpoint handles order submission by calling the Supabase RPC function `create_order`.
 * The RPC handles stock locking, validation, and insertion atomically.
 * 
 * Rate limiting is applied via checkRateLimit (5 requests/minute per IP).
 */

interface CheckoutSubmitRequest {
  // Customer information (guest or signed-in)
  customerId?: string | null  // UUID for signed-in users
  customerEmail?: string | null
  customerName?: string | null
  customerPhone?: string | null
  
  // Order items
  items: Array<{
    productId: string  // UUID
    variantId?: string | null  // UUID
    quantity: number
  }>
  
  // Delivery information
  deliveryType: "delivery" | "pickup"
  addressId?: string | null  // UUID for saved addresses
  newAddress?: { fullAddress: string; city: string } | null  // Manually entered address (guest or new)

  // Payment and pricing
  paymentMethod: "card" | "bank_transfer" | "jazzcash" | "easypaisa" | "nayapay" | "zindigi" | "raast"
  deliveryFee: number
  discountAmount?: number
  customerNotes?: string | null
  
  // Cart information (for validation)
  cartSubtotal: number
}

export async function POST(request: NextRequest) {
  // Rate limiting check (5 requests per minute per IP)
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = (await request.json()) as CheckoutSubmitRequest
    
    // Basic validation
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }
    
    if (!body.deliveryType || !["delivery", "pickup"].includes(body.deliveryType)) {
      return NextResponse.json(
        { error: "Invalid delivery type" },
        { status: 400 }
      )
    }
    
    if (!body.paymentMethod || !["card", "bank_transfer", "jazzcash", "easypaisa", "nayapay", "zindigi", "raast"].includes(body.paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      )
    }
    
    // Validate that we have either customerId OR customerEmail for the RPC
    if (!body.customerId && !body.customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required for guest checkout" },
        { status: 400 }
      )
    }

    // Resolve the customer up front (rather than letting the RPC upsert it),
    // because a manually-entered address needs a customer_id to attach to
    // BEFORE create_order runs.
    let customerId: string | null = body.customerId || null
    if (!customerId && body.customerEmail) {
      const normalizedEmail = body.customerEmail.toLowerCase().trim()
      const { data: existingCustomer, error: lookupError } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle()

      if (lookupError) {
        console.error("Failed to look up customer:", lookupError)
        return NextResponse.json({ error: "Failed to process customer information" }, { status: 500 })
      }

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        const { data: newCustomer, error: customerError } = await supabaseAdmin
          .from("customers")
          .insert({ email: normalizedEmail, name: body.customerName || null, phone: body.customerPhone || null })
          .select("id")
          .single()

        if (customerError || !newCustomer) {
          console.error("Failed to create customer:", customerError)
          return NextResponse.json({ error: "Failed to process customer information" }, { status: 500 })
        }
        customerId = newCustomer.id
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: "Customer email is required for guest checkout" }, { status: 400 })
    }

    // Resolve the delivery address. The `orders` table only stores an
    // address_id (no free-text street/city columns), so a manually-entered
    // address has to become a real `addresses` row before we call create_order
    // or the delivery address the customer typed is silently discarded.
    let addressId: string | null = body.addressId || null
    if (!addressId && body.deliveryType === "delivery" && body.newAddress?.fullAddress && body.newAddress?.city) {
      const province = pakistanCities.find(c => c.name === body.newAddress!.city)?.province || body.newAddress!.city

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
          city: body.newAddress.city,
          province,
          phone: body.customerPhone || null,
          is_default: (existingAddressCount ?? 0) === 0,
        })
        .select("id")
        .single()

      if (addressError || !newAddress) {
        console.error("Failed to save delivery address:", addressError)
        return NextResponse.json({ error: "Failed to save delivery address" }, { status: 500 })
      }
      addressId = newAddress.id
    }

    // Convert items to JSONB format expected by the RPC
    const itemsJsonb = body.items.map(item => ({
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity
    }))

    // Call the create_order RPC function using service role client (bypasses RLS)
    const { data, error } = await supabaseAdmin.rpc(
      'create_order',
      {
        p_customer_id: customerId,
        p_customer_email: body.customerEmail || null,
        p_customer_name: body.customerName || null,
        p_customer_phone: body.customerPhone || null,
        p_items: itemsJsonb,
        p_delivery_type: body.deliveryType,
        p_address_id: addressId,
        p_payment_method: body.paymentMethod,
        p_delivery_fee: body.deliveryFee,
        p_discount_amount: body.discountAmount || 0,
        p_customer_notes: body.customerNotes || null
      }
    )
    
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
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        },
        { status: statusCode }
      )
    }
    
    // Success - return the order information.
    // Note: create_order only returns { order_id, order_number, customer_id, total } -
    // subtotal/delivery_fee/payment_method/customer info are NOT part of its
    // response, so they must come from the request body / resolved values,
    // never from `data`.
    const orderId = data.order_id
    const orderNumber = data.order_number
    const total = data.total || 0
    const paymentMethod = body.paymentMethod
    const subtotal = body.cartSubtotal
    const deliveryFee = body.deliveryFee
    const customerEmail = body.customerEmail || null
    const customerName = body.customerName || null

    // Fetch order items once, used for both the confirmation email and the
    // payment page redirect (which needs item names/prices to display).
    const { data: orderItems, error: orderItemsError } = await supabaseAdmin
      .from("order_items")
      .select("product_id, product_name, quantity, unit_price")
      .eq("order_id", orderId)

    if (orderItemsError) {
      console.error("Failed to fetch order items:", orderItemsError)
    }

    // Fire-and-forget order confirmation email
    // ponytail: Non-blocking - email failure shouldn't fail the order
    if (customerEmail && orderItems) {
      sendOrderConfirmationEmail({
        toEmail: customerEmail,
        customerName,
        orderNumber: orderNumber?.toString() ?? orderId,
        orderId: orderId.toString(),
        items: orderItems.map(item => ({
          productName: item.product_name,
          quantity: item.quantity,
          price: item.unit_price
        })),
        subtotal,
        deliveryFee,
        total,
        deliveryType: body.deliveryType,
        paymentMethod
      }).catch(err => {
        console.error("Failed to send order confirmation email:", err)
      })
    }

    // Build query parameters for the payment page
    const queryParams = new URLSearchParams({
      orderId: orderId.toString(),
      orderNumber: orderNumber.toString(),
      total: total.toString(),
      customerEmail: customerEmail || "",
      customerName: customerName || "",
      items: JSON.stringify(
        (orderItems || []).map(item => ({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          price: item.unit_price
        }))
      ),
      deliveryType: body.deliveryType,
      deliveryFee: deliveryFee.toString(),
      subtotal: subtotal.toString(),
    })

    return NextResponse.json(
      {
        success: true,
        order: data,
        redirectTo: `/checkout/pay?${queryParams.toString()}`
      },
      { status: 200 }
    )
    
  } catch (err) {
    console.error("Checkout submission error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { 
        error: "An unexpected error occurred while processing your order",
        details: process.env.NODE_ENV === 'development' ? message : undefined 
      },
      { status: 500 }
    )
  }
}