// Order cancellation e-mail -- sent when an order is cancelled in the admin panel and when an
// unpaid order expires after 24 hours (/api/cron/expire-pending-orders).
import { sendEmail } from './mailer'
import { SHOP_URL, emailSignOff } from './common'

interface OrderCancelledData {
  toEmail: string
  customerName?: string | null
  orderNumber: string
}

export async function sendOrderCancelledEmail(data: OrderCancelledData): Promise<void> {
  const greeting = data.customerName ? 'Hi ' + data.customerName + ',' : 'Hi there,'

  await sendEmail({
    to: data.toEmail,
    subject: 'Order cancelled - #' + data.orderNumber,
    text: `${greeting}

Your order #${data.orderNumber} has been cancelled because we did not receive payment for the order invoice.

Nothing is owed on your side. If you would still like these items, you are very welcome to book your order again on our website whenever you like: ${SHOP_URL}

Please note that availability is subject to stock at the time you book.

${emailSignOff()}`,
  })
}
