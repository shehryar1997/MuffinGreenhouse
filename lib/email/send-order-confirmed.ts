// Order confirmed/payment received email sender
import { Resend } from 'resend'

const FROM_EMAIL = 'Muffin Plants <support@muffinplants.com>'

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  return new Resend(apiKey)
}

interface OrderConfirmedData {
  toEmail: string
  customerName?: string
  orderNumber: string
  total: number
  items: Array<{ productName: string; quantity: number; price: number }>
  deliveryType: 'delivery' | 'pickup'
}

function formatPrice(price: number): string {
  return 'PKR ' + price.toLocaleString('en-PK')
}

export async function sendOrderConfirmedEmail(data: OrderConfirmedData): Promise<void> {
  const resend = getResend()
  const greeting = data.customerName ? 'Hi ' + data.customerName + ',' : 'Hi there,'
  
  const itemsList = data.items
    .map(item => item.productName + ' x ' + item.quantity + ' - ' + formatPrice(item.price * item.quantity))
    .join('\\n')

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [data.toEmail],
    subject: 'Payment received - Order #' + data.orderNumber + ' confirmed!',
    text: greeting + '\\n\\n' +
      'Great news! We have received your payment.\\n\\n' +
      'Your order #' + data.orderNumber + ' is now confirmed and will ship in 1-2 business days.\\n\\n' +
      '---\\n' +
      'INVOICE\\n' +
      '---\\n' +
      itemsList + '\\n\\n' +
      'Total: ' + formatPrice(data.total) + '\\n' +
      'Delivery Type: ' + (data.deliveryType === 'delivery' ? 'Delivery' : 'Pickup') + '\\n\\n' +
      '---\\n\\n' +
      'We will send you a tracking update once your order ships.\\n\\n' +
      '— The Muffin Greenhouse Team',
  })

  if (error) {
    console.error('Failed to send order confirmed email:', error)
    throw new Error('Failed to send confirmation: ' + error.message)
  }
}
