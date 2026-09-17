import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { supabaseAdmin } from "@/supabase/admin-client"
import { sendOrderConfirmationEmail } from "@/lib/email/send-order-confirmation"

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
        p_customer_id: body.customerId || null,
        p_customer_email: body.customerEmail || null,
        p_customer_name: body.customerName || null,
        p_customer_phone: body.customerPhone || null,
        p_items: itemsJsonb,
        p_delivery_type: body.deliveryType,
        p_address_id: body.addressId || null,
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
    
    // Success - return the order information
    const orderId = data.order_id || data.id
    const orderNumber = data.order_number || data.orderNumber
    const total = data.total || 0
    const paymentMethod = data.payment_method || data.paymentMethod
    const subtotal = data.subtotal || body.cartSubtotal
    const deliveryFee = data.delivery_fee || body.deliveryFee
    const customerEmail = data.customer_email || body.customerEmail
    const customerName = data.customer_name || body.customerName

    // Fire-and-forget order confirmation email
    // ponytail: Non-blocking - email failure shouldn't fail the order
    if (customerEmail) {
      // Fetch order items for the confirmation email
      supabaseAdmin
        .from("order_items")
        .select("product_name, quantity, unit_price")
        .eq("order_id", orderId)
        .then(({ data: items, error: itemsError }) => {
          if (itemsError || !items) {
            console.error("Failed to fetch order items for confirmation email:", itemsError)
            return
          }

          sendOrderConfirmationEmail({
            toEmail: customerEmail,
            customerName,
            orderNumber: orderNumber?.toString() ?? orderId,
            orderId: orderId.toString(),
            items: items.map(item => ({
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
        })
    }

    // Build query parameters for the payment page
    const queryParams = new URLSearchParams({
      orderId: orderId.toString(),
      orderNumber: orderNumber.toString(),
      total: total.toString(),
      paymentMethod: paymentMethod.toString()
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