// Overseas (Temu-sourced) products are ordered from the supplier only after the customer pays: ~5-7 business days
// to reach the shop + 3-5 days to the customer, so roughly 14 days from payment. In-stock items ship in 1-2
// business days. A cart/order with any overseas line ships as ONE parcel once that item arrives, so the slowest
// line sets the date for the whole order. Pure and dependency-free, so it's safe from server code, client
// components, emails and the admin form.

export type FulfillmentType = "in_stock" | "overseas"

export const OVERSEAS_LEAD_DAYS = 14
export const STANDARD_DISPATCH_TEXT = "1-2 business days"

type FulfillmentProduct = { fulfillmentType?: FulfillmentType | null; leadTimeDays?: number | null }

export function isOverseas(product: FulfillmentProduct | null | undefined): boolean {
  return product?.fulfillmentType === "overseas"
}

/** Days from payment to delivery for one product (0 when it ships from stock). */
export function leadTimeDays(product: FulfillmentProduct | null | undefined): number {
  if (!isOverseas(product)) return 0
  const days = product?.leadTimeDays
  return days && days > 0 ? days : OVERSEAS_LEAD_DAYS
}

export function cartHasOverseas(items: { product: FulfillmentProduct }[]): boolean {
  return items.some((i) => isOverseas(i.product))
}

/** The overseas lines in a cart, for naming the items that cause the longer wait. */
export function overseasItems<T extends { product: FulfillmentProduct }>(items: T[]): T[] {
  return items.filter((i) => isOverseas(i.product))
}

/** Slowest line wins: the whole order ships together. 0 when nothing is overseas. */
export function orderLeadTimeDays(items: { product: FulfillmentProduct }[]): number {
  return items.reduce((max, i) => Math.max(max, leadTimeDays(i.product)), 0)
}

/** Calendar-day addition on the Pakistan calendar date of `from`, so the result doesn't drift with the server's timezone. */
export function addDays(from: Date, days: number): Date {
  const karachi = new Date(from.toLocaleString("en-US", { timeZone: "Asia/Karachi" }))
  karachi.setHours(12, 0, 0, 0)
  karachi.setDate(karachi.getDate() + days)
  return karachi
}

/** "Thu, 8 Oct" */
export function formatEta(date: Date | string): string {
  const d = typeof date === "string" ? new Date(`${date}T12:00:00`) : date
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
}

/** `YYYY-MM-DD` for a `date` column. */
export function toDateColumn(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Reads a spreadsheet cell. Only a cell that clearly says overseas ("Ships from overseas", "overseas", "Temu"...)
 * gives 'overseas'; an explicit "in stock" gives 'in_stock'. A blank or unrecognised cell gives null, which importers
 * treat as "no setting": a new product is in stock, an existing product is left as it is. Never an error.
 */
export function parseFulfillmentCell(raw: string | null | undefined): FulfillmentType | null {
  const s = (raw ?? "").trim().toLowerCase()
  if (!s) return null
  if (/overseas|temu|abroad|international/.test(s)) return "overseas"
  if (/stock|local|domestic|standard/.test(s)) return "in_stock"
  return null
}

/** A positive whole number of days (1-90) from a spreadsheet cell, else null (= the 14-day default). */
export function parseLeadTimeCell(raw: string | null | undefined): number | null {
  const n = Number((raw ?? "").trim())
  return Number.isInteger(n) && n >= 1 && n <= 90 ? n : null
}
