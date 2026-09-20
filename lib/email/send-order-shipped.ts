// Order shipped email sender - includes courier tracking info
import { sendEmail } from './mailer'
import { emailSignOff, formatEmailPrice, renderEmailTemplate, getCourierTrackingUrl, SITE_URL } from './common'

interface OrderShippedData {
  toEmail: string
  customerName?: string | null
  orderNumber: string
  publicToken: string
  total: number
  items: Array<{ productName: string; quantity: number; price: number }>
  deliveryType: 'delivery' | 'pickup'
  trackingNumber: string
  courier: string
}

export async function sendOrderShippedEmail(data: OrderShippedData): Promise<void> {
  const greeting = data.customerName ? 'Hi ' + data.customerName + ',' : 'Hi there,'

  const itemsList = data.items
    .map(item => item.productName + ' x ' + item.quantity + ' - ' + formatEmailPrice(item.price * item.quantity))
    .join('\n')

  const textBody = `${greeting}

Your order #${data.orderNumber} is on its way!

---
TRACKING
---
Courier: ${data.courier}
Tracking Number: ${data.trackingNumber}

You can use this tracking number on the ${data.courier} website to follow your shipment.

---
ORDER SUMMARY
---
${itemsList}

Total: ${formatEmailPrice(data.total)}
Delivery Type: ${data.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}

---

Thanks for shopping with us!

${emailSignOff()}`

  const trackingUrl = getCourierTrackingUrl(data.courier, data.trackingNumber)

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
    heading: `Your order #${data.orderNumber} has shipped!`,
    previewText: `Your order is on its way! Track your ${data.courier} shipment with tracking number ${data.trackingNumber}.`,
    sections: [
      { content: "Your order is on its way and should arrive soon! Here are your tracking details:" },
      { title: 'Tracking Information', content: `<p style="margin:0 0 8px;"><strong>Courier:</strong> ${data.courier}</p><p style="margin:0 0 12px;"><strong>Tracking Number:</strong> <a href="${trackingUrl}" style="color:#166534;text-decoration:underline;font-weight:500;">${data.trackingNumber}</a></p><p style="margin:0;font-size:14px;color:#666;">Click the tracking number above to follow your shipment on the courier's website.</p>` },
      { content: `<p style="margin:0 0 12px;"><strong>Track:</strong> <a href="${trackingUrl}" style="color:#166534;text-decoration:underline;">Track Your Shipment</a></p><p style="margin:0;"><strong>Order:</strong> <a href="${SITE_URL}/orders/${data.publicToken}" style="color:#166534;text-decoration:underline;">View Your Order</a></p>` },
      { title: 'Order Summary', content: orderSummaryHtml },
      { content: "Thanks for shopping with us! We hope you love your plants." },
    ],
  })

  await sendEmail({
    to: data.toEmail,
    subject: 'Your order #' + data.orderNumber + ' has shipped!',
    text: textBody,
    html: htmlBody,
  })
}
