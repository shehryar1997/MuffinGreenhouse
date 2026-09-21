import { NextRequest, NextResponse } from 'next/server'
import { safeEqual } from '@/lib/safe-compare'
import { sendPaymentReminders } from '@/lib/payment-reminders'

export const dynamic = 'force-dynamic'

// Sends the 12-hour "payment reminder" e-mails. Vercel's cron is only daily on this plan, so the hourly
// GitHub Actions workflow (.github/workflows/payment-reminders.yml) calls this; the daily maintenance cron
// runs the same function as a fallback.
export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret) {
    console.error('CRON_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  if (!(await safeEqual(request.headers.get('authorization'), 'Bearer ' + expectedSecret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    return NextResponse.json({ message: 'Payment reminders processed', ...(await sendPaymentReminders()) })
  } catch (err) {
    console.error('Payment reminders failed:', err)
    return NextResponse.json({ error: 'Payment reminders failed' }, { status: 500 })
  }
}
