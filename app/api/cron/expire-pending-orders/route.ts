import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/supabase/admin-client'
import { sendOrderCancelledEmail } from '@/lib/email/send-order-cancelled'
import { safeEqual } from '@/lib/safe-compare'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) {
    console.error('CRON_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  if (!(await safeEqual(authHeader, 'Bearer ' + expectedSecret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find pending orders older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: expiredOrders, error: fetchError } = await supabaseAdmin
      .from('orders')
      // `orders` has no customer_email/customer_name columns -- they live on the linked customer.
      .select('id, order_number, status, payment_status, created_at, customer:customers(email, name)')
      .eq('status', 'pending')
      .eq('payment_status', 'pending')
      .lt('created_at', twentyFourHoursAgo)

    if (fetchError) {
      console.error('Error fetching expired orders:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({ message: 'No expired orders found', cancelled: 0 })
    }

    const cancelledOrders: string[] = []
    const failedEmails: string[] = []

    for (const order of expiredOrders) {
      const customer = order.customer as unknown as { email: string; name: string | null } | null
      // Update order to cancelled
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', order.id)

      if (updateError) {
        console.error('Failed to cancel order', order.id, updateError)
        continue
      }

      cancelledOrders.push(order.order_number)

      // Send cancellation email
      if (customer?.email) {
        try {
          await sendOrderCancelledEmail({
            toEmail: customer.email,
            customerName: customer.name ?? undefined,
            orderNumber: order.order_number,
          })
        } catch (emailError) {
          console.error('Failed to send cancellation email for order', order.order_number, emailError)
          failedEmails.push(order.order_number)
        }
      }
    }

    return NextResponse.json({
      message: 'Cron job completed',
      cancelled: cancelledOrders.length,
      cancelledOrders,
      failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
    })
  } catch (err) {
    console.error('Cron job error:', err)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
