import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/supabase/admin-client'
import { sendOrderCancelledEmail } from '@/lib/email/send-order-cancelled'
import { safeEqual } from '@/lib/safe-compare'
import { isPlaceholderEmail } from '@/lib/manual-order'

export const dynamic = 'force-dynamic'

const HOLD_HOURS = 24

// Unpaid bookings are held for 24 hours. The cancelling itself (order status + putting the stock
// back) happens in the database and runs HOURLY via pg_cron (job "release-unpaid-holds").
// This route, scheduled daily by Vercel, does two things:
//   1. runs the same sweep once more, as a safety net if the hourly job is ever paused;
//   2. sends the "your order was cancelled" e-mail for every order the sweep cancelled that
//      the customer hasn't been told about yet.
export async function GET(request: NextRequest) {
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
    const { data: swept, error: sweepError } = await supabaseAdmin.rpc('expire_pending_orders', { p_hours: HOLD_HOURS })
    if (sweepError) {
      console.error('expire_pending_orders failed:', sweepError)
      return NextResponse.json({ error: 'Failed to expire orders' }, { status: 500 })
    }
    const { data: releasedRegistrations } = await supabaseAdmin.rpc('expire_pending_event_registrations', { p_hours: HOLD_HOURS })

    // Orders cancelled by expiry (hourly job or the sweep above) whose customer hasn't been e-mailed.
    const { data: toNotify, error: fetchError } = await supabaseAdmin
      .from('orders')
      // `orders` has no customer_email/customer_name columns -- they live on the linked customer.
      .select('id, order_number, customer:customers(email, name)')
      .eq('status', 'cancelled')
      .eq('cancel_reason', 'expired')
      .is('cancellation_email_sent_at', null)
      .limit(200)

    if (fetchError) {
      console.error('Error fetching orders to notify:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    const emailed: string[] = []
    const failedEmails: string[] = []

    for (const order of toNotify ?? []) {
      const customer = order.customer as unknown as { email: string; name: string | null } | null
      if (!customer?.email || isPlaceholderEmail(customer.email)) {
        // Nobody to tell; mark it done so it isn't retried forever.
        await supabaseAdmin.from('orders').update({ cancellation_email_sent_at: new Date().toISOString() }).eq('id', order.id)
        continue
      }
      try {
        await sendOrderCancelledEmail({
          toEmail: customer.email,
          customerName: customer.name ?? undefined,
          orderNumber: order.order_number,
        })
        await supabaseAdmin.from('orders').update({ cancellation_email_sent_at: new Date().toISOString() }).eq('id', order.id)
        emailed.push(order.order_number)
      } catch (emailError) {
        console.error('Failed to send cancellation email for order', order.order_number, emailError)
        failedEmails.push(order.order_number) // stays unsent, so tomorrow's run retries it
      }
    }

    return NextResponse.json({
      message: 'Cron job completed',
      expiredNow: swept ?? 0,
      eventBookingsReleased: releasedRegistrations ?? 0,
      emailed: emailed.length,
      cancelledOrders: emailed,
      failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
    })
  } catch (err) {
    console.error('Cron job error:', err)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
