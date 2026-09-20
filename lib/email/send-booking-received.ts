// "Order booked" e-mail -- sent right after checkout. Tells the customer their plants are on
// hold for 24 hours and how to pay. (The "payment received / order confirmed" e-mail is sent
// later, when the order is marked as paid in the admin panel: see send-order-confirmed.ts.)
import { sendEmail } from './mailer'
import { paymentAccountsAsText } from '@/config/payment-accounts'
import { WHATSAPP_NUMBER, emailSignOff, formatEmailPrice, renderEmailTemplate, SITE_URL } from './common'

interface BookingReceivedData {
  toEmail: string
  customerName?: string | null
  orderNumber: string
  publicToken: string
  total: number
  subtotal?: number
  deliveryFee?: number
  items: Array<{ productName: string; quantity: number; price: number }>
  deliveryType: 'delivery' | 'pickup'
  paymentDeadline: Date
}

export async function sendBookingReceivedEmail(data: BookingReceivedData): Promise<void> {
  const greeting = data.customerName ? 'Hi ' + data.customerName + ',' : 'Hi there,'
  // Deadlines are shown in Pakistan time regardless of where the server runs.
  const deadlineStr = data.paymentDeadline.toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Karachi',
  })

  const itemsList = data.items
    .map((item) => item.productName + ' x ' + item.quantity + ' - ' + formatEmailPrice(item.price * item.quantity))
    .join('\n')

  const isDelivery = data.deliveryType === 'delivery'
  const breakdown =
    data.subtotal !== undefined && data.deliveryFee !== undefined
      ? 'Subtotal: ' + formatEmailPrice(data.subtotal) + '\n' +
        (isDelivery ? 'Delivery: ' + formatEmailPrice(data.deliveryFee) : 'Pickup: Free') + '\n'
      : ''

  const textBody = `${greeting}

Thank you for your order at Muffin Plants! Your order has been booked and your items are on hold for you for the next 24 hours.

Order number: ${data.orderNumber}

---
ORDER DETAILS
---
${itemsList}

${breakdown}Total to pay: ${formatEmailPrice(data.total)}
Delivery Type: ${isDelivery ? 'Delivery' : 'Pickup'}

---
HOW TO CONFIRM YOUR BOOKING
---
Please send your payment within 24 hours (by ${deadlineStr}) to any one of these accounts:

${paymentAccountsAsText()}

Then share your payment receipt with us on WhatsApp at ${WHATSAPP_NUMBER}, quoting order number ${data.orderNumber}. Once we confirm your payment, we will send you an order confirmation e-mail.

If we don't receive payment within 24 hours, your items will be released and the order will be cancelled automatically. You are always welcome to book again, subject to availability.

${emailSignOff()}`

  const itemsHtml = data.items
    .map((item) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e7f5eb;">${item.productName} x ${item.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #e7f5eb;text-align:right;">${formatEmailPrice(item.price * item.quantity)}</td></tr>`)
    .join('')

  const breakdownHtml =
    data.subtotal !== undefined && data.deliveryFee !== undefined
      ? `<tr><td style="padding:8px 0;">Subtotal</td><td style="padding:8px 0;text-align:right;">${formatEmailPrice(data.subtotal)}</td></tr>
         <tr><td style="padding:8px 0;">${isDelivery ? 'Delivery' : 'Pickup'}</td><td style="padding:8px 0;text-align:right;">${isDelivery ? formatEmailPrice(data.deliveryFee) : 'Free'}</td></tr>`
      : ''

  const orderSummaryHtml = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:15px;color:#333;">
    ${itemsHtml}
    <tr><td colspan="2" style="border-bottom:1px solid #e7f5eb;"></td></tr>
    ${breakdownHtml}
    <tr><td style="padding:12px 0;font-weight:600;">Total to pay</td><td style="padding:12px 0;text-align:right;font-weight:600;color:#166534;">${formatEmailPrice(data.total)}</td></tr>
    <tr><td style="padding:4px 0;font-size:14px;color:#666;">Delivery Type</td><td style="padding:4px 0;text-align:right;font-size:14px;color:#666;">${isDelivery ? 'Delivery' : 'Pickup'}</td></tr>
  </table>`

  const htmlBody = renderEmailTemplate({
    heading: `Thank you for your order, ${data.customerName || 'there'}!`,
    previewText: `Your order #${data.orderNumber} is on hold for 24 hours. Please send payment by ${deadlineStr} to confirm.`,
    sections: [
      { content: "Your order has been booked and your items are on hold for the next <strong>24 hours</strong>. Please complete your payment to confirm your booking." },
      { title: 'Order Summary', content: orderSummaryHtml },
      { title: 'How to Confirm Your Booking', content: `<p style="margin:0 0 12px;">Send your payment by <strong>${deadlineStr}</strong> to any one of these accounts:</p><pre style="background:#f6fdf8;padding:16px;border-radius:8px;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;font-family:inherit;">${paymentAccountsAsText()}</pre><p style="margin:12px 0 0;">Then share your payment receipt with us on WhatsApp at <a href="https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}" style="color:#166534;text-decoration:underline;">${WHATSAPP_NUMBER}</a>, quoting order number <strong>${data.orderNumber}</strong>.</p>` },
      { content: "If we don't receive payment within 24 hours, your items will be released and the order will be cancelled automatically. You are always welcome to book again, subject to availability." },
    ],
    primaryButton: { text: 'View Your Order', url: `${SITE_URL}/orders/${data.publicToken}` },
  })

  await sendEmail({
    to: data.toEmail,
    subject: 'Order booked - your plants are on hold for 24 hours - #' + data.orderNumber,
    text: textBody,
    html: htmlBody,
  })
}
