// Order confirmed/payment received email sender
import { sendEmail } from './mailer'
import { emailSignOff, formatEmailPrice, renderEmailTemplate, SITE_URL } from './common'

interface OrderConfirmedData {
  toEmail: string
  customerName?: string
  orderNumber: string
  publicToken: string
  total: number
  items: Array<{ productName: string; quantity: number; price: number }>
  deliveryType: 'delivery' | 'pickup'
}

export async function sendOrderConfirmedEmail(data: OrderConfirmedData): Promise<void> {
  const greeting = data.customerName ? 'Hi ' + data.customerName + ',' : 'Hi there,'

  const itemsList = data.items
    .map(item => item.productName + ' x ' + item.quantity + ' - ' + formatEmailPrice(item.price * item.quantity))
    .join('\n')

  const textBody = `${greeting}

Great news! We have received your payment.

Your order #${data.orderNumber} is now confirmed and will ship in 1-2 business days.

---
INVOICE
---
${itemsList}

Total: ${formatEmailPrice(data.total)}
Delivery Type: ${data.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}

---

We will send you a tracking update once your order ships.

${emailSignOff()}`

  const itemsHtml = data.items
    .map(item => `<tr><td style="padding:8px 0;border-bottom:1px solid #e7f5eb;">${item.productName} x ${item.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #e7f5eb;text-align:right;">${formatEmailPrice(item.price * item.quantity)}</td></tr>`)
    .join('')

  const orderSummaryHtml = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:15px;color:#333;">
    ${itemsHtml}
    <tr><td colspan="2" style="border-bottom:1px solid #e7f5eb;"></td></tr>
    <tr><td style="padding:12px 0;font-weight:600;">Total</td><td style="padding:12px 0;text-align:right;font-weight:600;color:#166534;">${formatEmailPrice(data.total)}</td></tr>
    <tr><td style="padding:4px 0;font-size:14px;color:#666;">Delivery Type</td><td style="padding:4px 0;text-align:right;font-size:14px;color:#666;">${data.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}</td></tr>
  </table>`

  const htmlBody = renderEmailTemplate({
    heading: `Payment received — Order #${data.orderNumber} confirmed!`,
    previewText: `Great news! Your payment has been received and your order #${data.orderNumber} is confirmed.`,
    sections: [
      { content: "<strong>Great news!</strong> We have received your payment. Your order is now confirmed and will ship within <strong>1-2 business days</strong>." },
      { title: 'Order Summary', content: orderSummaryHtml },
      { content: "We will send you a tracking update with your courier details once your order ships." },
    ],
    primaryButton: { text: 'View Your Order', url: `${SITE_URL}/orders/${data.publicToken}` },
  })

  await sendEmail({
    to: data.toEmail,
    subject: 'Payment received - Order #' + data.orderNumber + ' confirmed!',
    text: textBody,
    html: htmlBody,
  })
}
