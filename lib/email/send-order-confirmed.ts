// Order confirmed/payment received email sender
import { sendEmail } from './mailer'
import { emailSignOff } from './common'

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
  const greeting = data.customerName ? 'Hi ' + data.customerName + ',' : 'Hi there,'

  const itemsList = data.items
    .map(item => item.productName + ' x ' + item.quantity + ' - ' + formatPrice(item.price * item.quantity))
    .join('\n')

  await sendEmail({
    to: data.toEmail,
    subject: 'Payment received - Order #' + data.orderNumber + ' confirmed!',
    text: `${greeting}

Great news! We have received your payment.

Your order #${data.orderNumber} is now confirmed and will ship in 1-2 business days.

---
INVOICE
---
${itemsList}

Total: ${formatPrice(data.total)}
Delivery Type: ${data.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}

---

We will send you a tracking update once your order ships.

${emailSignOff()}`,
  })
}
