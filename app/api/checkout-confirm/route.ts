import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { checkRateLimit } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/supabase/admin-client'

// The customer's "Confirm booking" click on the payment page. The "order booked / on hold for
// 24 hours / how to pay" e-mail is already sent when the order is placed (see
// /api/checkout-submit), so this only verifies the order and acknowledges -- it sends no e-mail.
// (orderId is a random UUID, so an order number alone can't be used to probe orders.)
const confirmSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string().trim().min(1).max(40),
})

interface OrderForConfirmation {
  id: string
  order_number: string
  status: string
  payment_status: string
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
      .select('id, order_number, status, payment_status')
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
