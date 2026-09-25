// Shared between /checkout (writes) and /checkout/pay (reads). The order
// summary travels through sessionStorage rather than the URL so customer
// name/email never land in browser history, server logs or GA page_location.
export const PAYMENT_SUMMARY_KEY_PREFIX = "muffin:payment-summary:"

export interface PaymentSummary {
  orderId: string
  orderNumber: string
  publicToken: string
  total: number
  customerEmail: string
  customerName: string
  items: Array<{ productId: string; productName: string; quantity: number; price: number }>
  deliveryType: "delivery" | "pickup"
  deliveryFee: number
  subtotal: number
  /** Coupon discount taken off the subtotal (0 or absent when none). */
  discount?: number
  /** Provisional delivery date (e.g. "Thu, 8 Oct") when the order has an overseas item; firmed up once paid. */
  overseasEstimate?: string
}
