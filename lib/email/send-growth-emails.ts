// Marketing / lifecycle e-mails: welcome coupon, referral reward, back in stock, price drop, payment reminder.
import { sendEmail } from './mailer'
import { SITE_URL, SHOP_URL, WHATSAPP_NUMBER, emailSignOff, formatEmailPrice, renderEmailTemplate } from './common'

const greet = (name?: string | null) => (name ? 'Hi ' + name + ',' : 'Hi there,')

const codeBox = (code: string) =>
  `<p style="margin:12px 0;padding:14px;text-align:center;font-size:22px;letter-spacing:2px;font-weight:700;background:#f0fdf4;border:1px dashed #166534;border-radius:8px;color:#166534;">${code}</p>`

export async function sendWelcomeCouponEmail(data: { toEmail: string; code: string; amount: number }): Promise<void> {
  const text = `Welcome to Muffin Plants!

Here is ${formatEmailPrice(data.amount)} off your first order. Enter this code at checkout:

${data.code}

The code works once, on your first order, with the e-mail address you signed up with.

Shop now: ${SHOP_URL}

${emailSignOff()}`
  const html = renderEmailTemplate({
    heading: `${formatEmailPrice(data.amount)} off your first order`,
    previewText: `Your welcome code: ${data.code}`,
    sections: [
      { content: 'Welcome to Muffin Plants! Enter this code at checkout:' },
      { content: codeBox(data.code) },
      { content: 'It works once, on your first order, with the e-mail address you signed up with.' },
    ],
    primaryButton: { text: 'Start Shopping', url: SHOP_URL },
  })
  await sendEmail({ to: data.toEmail, subject: `Your ${formatEmailPrice(data.amount)} welcome coupon`, text, html })
}

export async function sendReferralRewardEmail(data: { toEmail: string; name?: string | null; code: string; amount: number }): Promise<void> {
  const text = `${greet(data.name)}

A friend you referred just placed an order, so here is ${formatEmailPrice(data.amount)} off your next purchase. Enter this code at checkout:

${data.code}

It works once, with this e-mail address. Thank you for spreading the word!

${emailSignOff()}`
  const html = renderEmailTemplate({
    heading: `Thank you! ${formatEmailPrice(data.amount)} off your next order`,
    previewText: `Your reward code: ${data.code}`,
    sections: [
      { content: `${greet(data.name)} a friend you referred just placed an order. Here is your reward:` },
      { content: codeBox(data.code) },
      { content: 'It works once, on your next purchase, with this e-mail address.' },
    ],
    primaryButton: { text: 'Shop Now', url: SHOP_URL },
  })
  await sendEmail({ to: data.toEmail, subject: `Your ${formatEmailPrice(data.amount)} referral reward`, text, html })
}

export async function sendBackInStockEmail(data: { toEmail: string; productName: string; slug: string; price: number }): Promise<void> {
  const url = `${SITE_URL}/shop/product/${data.slug}`
  const text = `Good news! ${data.productName} is back in stock (${formatEmailPrice(data.price)}).

Stock is limited, so grab it while it lasts: ${url}

${emailSignOff()}`
  const html = renderEmailTemplate({
    heading: `${data.productName} is back in stock`,
    previewText: `${data.productName} is available again`,
    sections: [
      { content: `Good news! <strong>${data.productName}</strong> is back in stock at ${formatEmailPrice(data.price)}.` },
      { content: 'Stock is limited, so grab it while it lasts.' },
    ],
    primaryButton: { text: 'View Plant', url },
  })
  await sendEmail({ to: data.toEmail, subject: `Back in stock: ${data.productName}`, text, html })
}

export async function sendPriceDropEmail(data: { toEmail: string; productName: string; slug: string; oldPrice: number; newPrice: number }): Promise<void> {
  const url = `${SITE_URL}/shop/product/${data.slug}`
  const text = `Price drop on something you saved: ${data.productName} is now ${formatEmailPrice(data.newPrice)} (was ${formatEmailPrice(data.oldPrice)}).

${url}

${emailSignOff()}`
  const html = renderEmailTemplate({
    heading: `Price drop: ${data.productName}`,
    previewText: `Now ${formatEmailPrice(data.newPrice)}, was ${formatEmailPrice(data.oldPrice)}`,
    sections: [
      { content: `<strong>${data.productName}</strong> from your wishlist just got cheaper.` },
      { content: `Now <strong>${formatEmailPrice(data.newPrice)}</strong> <span style="text-decoration:line-through;color:#888;">${formatEmailPrice(data.oldPrice)}</span>` },
    ],
    primaryButton: { text: 'View Plant', url },
  })
  await sendEmail({ to: data.toEmail, subject: `Price drop: ${data.productName}`, text, html })
}

export async function sendPaymentReminderEmail(data: {
  toEmail: string
  customerName?: string | null
  orderNumber: string
  publicToken: string
  total: number
  hoursLeft: number
}): Promise<void> {
  const url = `${SITE_URL}/orders/${data.publicToken}`
  const left = data.hoursLeft <= 1 ? 'less than an hour' : `about ${data.hoursLeft} hours`
  const text = `${greet(data.customerName)}

Just a reminder: we haven't received payment for order #${data.orderNumber} (${formatEmailPrice(data.total)}) yet. Your plants are on hold for ${left} more, after which the order is released automatically.

See the payment accounts and your order: ${url}

Already paid? Please share your receipt on WhatsApp at ${WHATSAPP_NUMBER}, quoting #${data.orderNumber}, so we can confirm it.

${emailSignOff()}`
  const html = renderEmailTemplate({
    heading: `Order #${data.orderNumber}: payment reminder`,
    previewText: `Your plants are on hold for ${left} more`,
    sections: [
      { content: `${greet(data.customerName)} we haven't received payment of <strong>${formatEmailPrice(data.total)}</strong> for order #${data.orderNumber} yet.` },
      { content: `Your plants are on hold for <strong>${left}</strong> more. After that the order is released automatically.` },
      { content: `Already paid? Share your receipt on WhatsApp at ${WHATSAPP_NUMBER}, quoting #${data.orderNumber}, and we'll confirm it.` },
    ],
    primaryButton: { text: 'View payment details', url },
  })
  await sendEmail({ to: data.toEmail, subject: `Reminder: payment for order #${data.orderNumber}`, text, html })
}
