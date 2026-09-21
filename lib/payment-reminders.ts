// SERVER-ONLY. "Please pay" reminder for bookings that are still unpaid 12 hours after they were placed.
// Orders are held for 24h, so the reminder lands with roughly half the hold left. One reminder per order.
import { supabaseAdmin } from "@/supabase/admin-client"
import { isPlaceholderEmail } from "@/lib/manual-order"
import { sendPaymentReminderEmail } from "@/lib/email/send-growth-emails"

const HOUR_MS = 60 * 60 * 1000
const REMIND_AFTER_HOURS = 12
const HOLD_HOURS = 24

export async function sendPaymentReminders(): Promise<{ sent: number; failed: number }> {
  const now = Date.now()
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, public_token, total, created_at, customer:customers(email, name)")
    .eq("status", "pending")
    .eq("payment_status", "pending")
    .is("payment_reminder_sent_at", null)
    .lt("created_at", new Date(now - REMIND_AFTER_HOURS * HOUR_MS).toISOString())
    .gt("created_at", new Date(now - HOLD_HOURS * HOUR_MS).toISOString()) // already-expired orders are being released, not chased
    .limit(100)
  if (error) throw new Error(error.message)

  let sent = 0
  let failed = 0
  for (const order of data ?? []) {
    const customer = order.customer as unknown as { email: string | null; name: string | null } | null
    const markDone = () => supabaseAdmin.from("orders").update({ payment_reminder_sent_at: new Date().toISOString() }).eq("id", order.id)

    if (!customer?.email || isPlaceholderEmail(customer.email)) {
      await markDone() // nobody to tell; don't look at it again
      continue
    }
    try {
      const hoursLeft = Math.max(1, Math.ceil((new Date(order.created_at).getTime() + HOLD_HOURS * HOUR_MS - now) / HOUR_MS))
      await sendPaymentReminderEmail({
        toEmail: customer.email,
        customerName: customer.name,
        orderNumber: order.order_number,
        publicToken: order.public_token,
        total: Number(order.total),
        hoursLeft,
      })
      await markDone()
      sent++
    } catch (err) {
      console.error("Payment reminder failed for order", order.order_number, err) // stays unsent: the next run retries
      failed++
    }
  }
  return { sent, failed }
}
