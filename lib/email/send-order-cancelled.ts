// Order cancellation e-mail -- sent when an order is cancelled in the admin panel and when an
// unpaid order expires after 24 hours (/api/cron/expire-pending-orders).
import { Resend } from 'resend'
import { FROM_EMAIL, SHOP_URL, emailSignOff } from './common'

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  return new Resend(apiKey)
}

interface OrderCancelledData {
  toEmail: string
  customerName?: string | null
  orderNumber: string
}

export async function sendOrderCancelledEmail(data: OrderCancelledData): Promise<void> {
  const resend = getResend()
  const greeting = data.customerName ? 'Hi ' + data.customerName + ',' : 'Hi there,'

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [data.toEmail],
    subject: 'Order cancelled - #' + data.orderNumber,
    text: `${greeting}

Your order #${data.orderNumber} has been cancelled because we did not receive payment for the order invoice.

Nothing is owed on your side. If you would still like these items, you are very welcome to book your order again on our website whenever you like: ${SHOP_URL}

Please note that availability is subject to stock at the time you book.

${emailSignOff()}`,
  })

  if (error) {
    console.error('Failed to send order cancelled email:', error)
    throw new Error('Failed to send cancellation: ' + error.message)
  }
}
