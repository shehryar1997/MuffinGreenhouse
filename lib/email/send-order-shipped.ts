// Order shipped email sender - includes courier tracking info
import { sendEmail } from './mailer'
import { emailSignOff } from './common'

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
  const greeting = data.customerName ? 'Hi ' + data.customerName + ',' : 'Hi there,'

  const itemsList = data.items
    .map(item => item.productName + ' x ' + item.quantity + ' - ' + formatPrice(item.price * item.quantity))
    .join('\n')

  await sendEmail({
    to: data.toEmail,
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

${emailSignOff()}`,
  })
}
