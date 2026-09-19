import { sendGAEvent as nextSendGAEvent } from "@next/third-parties/google"

/**
 * Wrapper for Google Analytics events with ecommerce support.
 * Only fires in browser environment and when GA is configured.
 */
export function sendGAEvent(event: string, params: Record<string, unknown>) {
  // Only send events in browser
  if (typeof window === "undefined") return
  
  // Only send if GA ID is configured
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  if (!gaId || gaId === "") return

  try {
    nextSendGAEvent(event, params)
  } catch (err) {
    console.error("GA Event Error:", err)
  }
}

/**
 * Track a purchase event for GA4 ecommerce
 */
export function trackPurchase(params: {
  transaction_id: string
  value: number
  currency: string
  items: Array<{
    item_name: string
    quantity: number
    price: number
  }>
}) {
  sendGAEvent("purchase", params)
}

/**
 * Track begin checkout event for GA4 ecommerce
 */
export function trackBeginCheckout(params: {
  value?: number
  currency?: string
  items?: Array<{
    item_name: string
    quantity: number
    price: number
  }>
}) {
  sendGAEvent("begin_checkout", params)
}

/**
 * Track add to cart event for GA4 ecommerce (optional future use)
 */
export function trackAddToCart(params: {
  value?: number
  currency?: string
  items?: Array<{
    item_name: string
    quantity: number
    price: number
  }>
}) {
  sendGAEvent("add_to_cart", params)
}

/**
 * Track view item event for GA4 ecommerce (optional future use)
 */
export function trackViewItem(params: {
  value?: number
  currency?: string
  items?: Array<{
    item_name: string
    price: number
  }>
}) {
  sendGAEvent("view_item", params)
}
