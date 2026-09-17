import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/supabase/admin-client'
import { sendBookingReceivedEmail } from '@/lib/email/send-booking-received'

interface CheckoutConfirmRequest {
  orderId: string
  customerEmail: string
  customerName: string
  orderNumber: string
  total: number
  items: Array<{ productId: string; productName: string; quantity: number; price: number }>
  deliveryType: 'delivery' | 'pickup'
  deliveryFee: number
  subtotal: number
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = (await request.json()) as CheckoutConfirmRequest
    const { customerEmail, customerName, orderNumber, total, items, deliveryType, deliveryFee, subtotal } = body

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 })
    }

    // ponytail: call create_order RPC with pending status
    // This assumes the order was already created during checkout-submit and we're just confirming it
    // If order doesn't exist, create it now
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, payment_status')
      .eq('order_number', orderNumber)
      .maybeSingle()

    let orderId = existingOrder?.id

    if (!existingOrder) {
      // Order doesn't exist yet - this shouldn't happen in normal flow but handle gracefully
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Send booking received email
    try {
      await sendBookingReceivedEmail({
        toEmail: customerEmail,
        customerName,
        orderNumber,
        total,
        items,
        deliveryType,
        paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        whatsappNumber: '+923095360009',
      })
    } catch (emailError) {
      console.error('Failed to send booking received email:', emailError)
      // Don't fail the order if email fails
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      message: 'Booking confirmed successfully',
    })
  } catch (err) {
    console.error('Checkout confirm error:', err)
    return NextResponse.json({ error: 'Failed to confirm booking' }, { status: 500 })
  }
}
