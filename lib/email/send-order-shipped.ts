// Order shipped email sender - includes courier tracking info
import { Resend } from 'resend'

const FROM_EMAIL = 'Muffin Plants <support@muffinplants.com>'

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  return new Resend(apiKey)
}

interface OrderShippedData {
  toEmail: string
  customerName?: string | null
  orderNumber: string
  total: number
  items: Array<{ productName: string; quantity: number; price: number }>
  deliveryType: 'delivery' | 'pickup'
  trackingNumber: string
  courier: string
}

function formatPrice(price: number): string {
  return 'PKR ' + price.toLocaleString('en-PK')
}

export async function sendOrderShippedEmail(data: OrderShippedData): Promise<void> {
  const resend = getResend()
  const greeting = data.customerName ? 'Hi ' + data.customerName + ',' : 'Hi there,'

  const itemsList = data.items
    .map(item => item.productName + ' x ' + item.quantity + ' - ' + formatPrice(item.price * item.quantity))
    .join('\n')

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [data.toEmail],
    subject: 'Your order #' + data.orderNumber + ' has shipped!',
    text: `${greeting}

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

Total: ${formatPrice(data.total)}
Delivery Type: ${data.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}

---

Thanks for shopping with us!

— The Muffin Greenhouse Team`,
  })

  if (error) {
    console.error('Failed to send order shipped email:', error)
    throw new Error('Failed to send shipped email: ' + error.message)
  }
}
