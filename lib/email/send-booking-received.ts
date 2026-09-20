// "Order booked" e-mail -- sent right after checkout. Tells the customer their plants are on
// hold for 24 hours and how to pay. (The "payment received / order confirmed" e-mail is sent
// later, when the order is marked as paid in the admin panel: see send-order-confirmed.ts.)
import { sendEmail } from './mailer'
import { paymentAccountsAsText } from '@/config/payment-accounts'
import { WHATSAPP_NUMBER, emailSignOff, formatEmailPrice } from './common'

interface BookingReceivedData {
  toEmail: string
  customerName?: string | null
  orderNumber: string
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

  await sendEmail({
    to: data.toEmail,
    subject: 'Order booked - your plants are on hold for 24 hours - #' + data.orderNumber,
    text: `${greeting}

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

${emailSignOff()}`,
  })
}
