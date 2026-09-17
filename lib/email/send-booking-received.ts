// Booking received email sender
import { Resend } from 'resend'

const FROM_EMAIL = 'Muffin Plants <support@muffinplants.com>'

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  return new Resend(apiKey)
}

interface BookingReceivedData {
  toEmail: string
  customerName?: string
  orderNumber: string
  total: number
  items: Array<{ productName: string; quantity: number; price: number }>
  deliveryType: 'delivery' | 'pickup'
  paymentDeadline: Date
  whatsappNumber: string
}

function formatPrice(price: number): string {
  return 'PKR ' + price.toLocaleString('en-PK')
}

export async function sendBookingReceivedEmail(data: BookingReceivedData): Promise<void> {
  const resend = getResend()
  const greeting = data.customerName ? 'Hi ' + data.customerName + ',' : 'Hi there,'
  const deadlineStr = data.paymentDeadline.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })
  
  const itemsList = data.items
    .map(item => item.productName + ' x ' + item.quantity + ' - ' + formatPrice(item.price * item.quantity))
    .join('\\n')

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [data.toEmail],
    subject: 'Booking received - #' + data.orderNumber,
    text: greeting + '\\n\\n' +
      'Thank you for your booking at Muffin Greenhouse!' + '\\n\\n' +
      'Your order number is: ' + data.orderNumber + '\\n\\n' +
      '---\\n' +
      'ORDER DETAILS\\n' +
      '---\\n' +
      itemsList + '\\n\\n' +
      'Total: ' + formatPrice(data.total) + '\\n' +
      'Delivery Type: ' + (data.deliveryType === 'delivery' ? 'Delivery' : 'Pickup') + '\\n\\n' +
      '---\\n' +
      'PAYMENT INSTRUCTIONS\\n' +
      '---\\n' +
      'Please complete your payment within 2 hours (by ' + deadlineStr + ').\\n\\n' +
      'Pay to any of these accounts:\\n' +
      '- HBL Bank: Account 03239533242\\n' +
      '- JazzCash: 03202065474\\n' +
      '- Easypaisa: 03202065474\\n\\n' +
      'After payment, share your receipt on WhatsApp: ' + data.whatsappNumber + '\\n\\n' +
      'If payment is not confirmed within 2 hours, your order will be automatically cancelled.\\n\\n' +
      '---\\n\\n' +
      '— The Muffin Greenhouse Team',
  })

  if (error) {
    console.error('Failed to send booking received email:', error)
    throw new Error('Failed to send booking received: ' + error.message)
  }
}
