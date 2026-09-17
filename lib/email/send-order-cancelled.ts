// Order cancellation email sender
import { Resend } from 'resend'

const FROM_EMAIL = 'Muffin Plants <support@muffinplants.com>'

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  return new Resend(apiKey)
}

interface OrderCancelledData {
  toEmail: string
  customerName?: string
  orderNumber: string
}

export async function sendOrderCancelledEmail(data: OrderCancelledData): Promise<void> {
  const resend = getResend()
  const greeting = data.customerName ? 'Hi ' + data.customerName + ',' : 'Hi there,'

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [data.toEmail],
    subject: 'Order cancelled - #' + data.orderNumber,
    text: greeting + '\n\n' +
      'Your order #' + data.orderNumber + ' has been cancelled.\n\n' +
      'Reason: Payment window expired.\n\n' +
      'The 2-hour payment window has passed, and we did not receive confirmation of your payment.\n\n' +
      'You can re-book anytime subject to availability.\n\n' +
      '— The Muffin Greenhouse Team',
  })

  if (error) {
    console.error('Failed to send order cancelled email:', error)
    throw new Error('Failed to send cancellation email: ' + error.message)
  }
}
