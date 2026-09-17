// ============================================================================
// MUFFIN NURSERY - ORDER CONFIRMATION EMAIL SENDER
// ============================================================================
// Sends order confirmation emails to customers after successful checkout.
//
// Usage:
//   import { sendOrderConfirmationEmail } from "@/lib/email/send-order-confirmation"
//   await sendOrderConfirmationEmail({
//     toEmail: "customer@example.com",
//     customerName: "John Doe",
//     orderNumber: "MGH-12345",
//     orderId: "uuid",
//     items: [...],
//     subtotal: 5000,
//     deliveryFee: 300,
//     total: 5300,
//     deliveryType: "delivery",
//     paymentMethod: "bank_transfer"
//   })
//
// ponytail: Uses Resend directly - not routed through /api/send-email to avoid
// the SEND_PASSWORD gate which is for human-operated admin replies only.
// ============================================================================

import { Resend } from "resend"

const FROM_EMAIL = "Muffin Plants <support@muffinplants.com>"

// Lazy initialization - Resend is only created when the function is called
// This avoids build-time errors when RESEND_API_KEY isn't available
function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set")
  }
  return new Resend(apiKey)
}

interface OrderItem {
  productName: string
  quantity: number
  price: number
}

interface OrderConfirmationData {
  toEmail: string
  customerName?: string | null
  orderNumber: string
  orderId: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  deliveryType: "delivery" | "pickup"
  paymentMethod: string
}

function formatPrice(price: number): string {
  return `PKR ${price.toLocaleString("en-PK")}`
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    card: "Credit/Debit Card",
    bank_transfer: "Bank Transfer",
    jazzcash: "JazzCash",
    easypaisa: "Easypaisa",
    nayapay: "NayaPay",
    zindigi: "Zindigi",
    raast: "Raast"
  }
  return labels[method] || method
}

/**
 * Send an order confirmation email to the customer.
 * @param data - Order confirmation data
 */
export async function sendOrderConfirmationEmail(data: OrderConfirmationData): Promise<void> {
  const resend = getResend()

  const greeting = data.customerName ? `Hi ${data.customerName},` : "Hi there,"

  const itemsList = data.items
    .map(item => `${item.productName} x ${item.quantity} - ${formatPrice(item.price * item.quantity)}`)
    .join("\n")

  const deliveryLabel = data.deliveryType === "delivery" ? "Delivery" : "Pickup"

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [data.toEmail],
    subject: `Order confirmation for #${data.orderNumber}`,
    text: `${greeting}

Thank you for your order at Muffin Greenhouse!

Your order number is: ${data.orderNumber}

---
ORDER DETAILS
---
${itemsList}

Subtotal: ${formatPrice(data.subtotal)}
${deliveryLabel} Fee: ${formatPrice(data.deliveryFee)}
Total: ${formatPrice(data.total)}

Payment Method: ${getPaymentMethodLabel(data.paymentMethod)}
Delivery Type: ${deliveryLabel}

---
WHAT'S NEXT?
---
We'll prepare your plants and send you another update when your order is ready.

${data.paymentMethod !== "card" ? `Since you chose ${getPaymentMethodLabel(data.paymentMethod)}, please complete your payment at your earliest convenience.` : ""}

If you have any questions, just reply to this email.

— The Muffin Greenhouse Team`,
  })

  if (error) {
    console.error("Failed to send order confirmation email:", error)
    throw new Error(`Failed to send order confirmation: ${error.message}`)
  }
}
