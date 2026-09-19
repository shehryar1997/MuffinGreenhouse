import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { checkRateLimit } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/supabase/admin-client'
import { sendBookingReceivedEmail } from '@/lib/email/send-booking-received'

// The browser only says WHICH order it is confirming. Recipient, name, items
// and total are all read back from the database -- otherwise anyone could POST
// arbitrary content to an arbitrary address from our support@ sender.
// (orderId is a random UUID, so an order number alone can't trigger this.)
const confirmSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string().trim().min(1).max(40),
})

interface OrderForConfirmation {
  id: string
  order_number: string
  status: string
  payment_status: string
  total: number
  delivery_type: 'delivery' | 'pickup'
  created_at: string
  customer: { email: string; name: string | null } | null
  order_items: Array<{ product_name: string; quantity: number; unit_price: number }>
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const parsed = confirmSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Order reference is required' }, { status: 400 })
    }
    const { orderId, orderNumber } = parsed.data

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(
        'id, order_number, status, payment_status, total, delivery_type, created_at, customer:customers(email, name), order_items(product_name, quantity, unit_price)'
      )
      .eq('id', orderId)
      .eq('order_number', orderNumber)
      .maybeSingle()

    if (error) {
      console.error('Checkout confirm lookup error:', error)
      return NextResponse.json({ error: 'Failed to confirm booking' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = data as unknown as OrderForConfirmation

    // Only a still-open, unpaid booking can be "confirmed".
    if (order.status !== 'pending' || order.payment_status !== 'pending') {
      return NextResponse.json({ error: 'This order can no longer be confirmed' }, { status: 409 })
    }

    // Send booking received email (to the address stored on the order)
    if (order.customer?.email) {
      try {
        await sendBookingReceivedEmail({
          toEmail: order.customer.email,
          customerName: order.customer.name ?? undefined,
          orderNumber: order.order_number,
          total: Number(order.total),
          items: (order.order_items ?? []).map((item) => ({
            productName: item.product_name,
            quantity: item.quantity,
            price: Number(item.unit_price),
          })),
          deliveryType: order.delivery_type,
          // Matches the 24h expiry applied by /api/cron/expire-pending-orders.
          paymentDeadline: new Date(new Date(order.created_at).getTime() + 24 * 60 * 60 * 1000),
          whatsappNumber: '+923095360009',
        })
      } catch (emailError) {
        console.error('Failed to send booking received email:', emailError)
        // Don't fail the order if email fails
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      message: 'Booking confirmed successfully',
    })
  } catch (err) {
    console.error('Checkout confirm error:', err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to confirm booking' }, { status: 500 })
  }
}
