// Order cancellation e-mail -- sent when an order is cancelled in the admin panel and when an
// unpaid order expires after 24 hours (/api/cron/expire-pending-orders).
import { sendEmail } from './mailer'
import { SHOP_URL, emailSignOff, renderEmailTemplate } from './common'

interface OrderCancelledData {
  toEmail: string
  customerName?: string | null
  orderNumber: string
}

export async function sendOrderCancelledEmail(data: OrderCancelledData): Promise<void> {
  const greeting = data.customerName ? 'Hi ' + data.customerName + ',' : 'Hi there,'

  const textBody = `${greeting}

Your order #${data.orderNumber} has been cancelled because we did not receive payment for the order invoice.

Nothing is owed on your side. If you would still like these items, you are very welcome to book your order again on our website whenever you like: ${SHOP_URL}

Please note that availability is subject to stock at the time you book.

${emailSignOff()}`

  const htmlBody = renderEmailTemplate({
    heading: `Order #${data.orderNumber} cancelled`,
    previewText: `Your order #${data.orderNumber} has been cancelled because we did not receive payment.`,
    sections: [
      { content: "Your order has been cancelled because we did not receive payment for the order invoice." },
      { content: "<strong>Nothing is owed on your side.</strong>" },
      { content: `If you would still like these items, you are very welcome to book your order again on our website whenever you like: <a href="${SHOP_URL}" style="color:#166534;text-decoration:underline;">Shop Now</a>` },
      { content: "Please note that availability is subject to stock at the time you book." },
    ],
    primaryButton: { text: 'Shop Again', url: SHOP_URL },
  })

  await sendEmail({
    to: data.toEmail,
    subject: 'Order cancelled - #' + data.orderNumber,
    text: textBody,
    html: htmlBody,
  })
}
