// The "New" badge on the storefront. An admin ticks "New Arrival?" on a product; the badge
// then lasts NEW_ARRIVAL_DAYS days from when the product went live (published_at, falling
// back to created_at) and disappears by itself:
//  * the storefront checks the age on every render (isWithinNewArrivalWindow), so an expired
//    badge is never shown even between cron runs; and
//  * /api/cron/daily-maintenance clears the stored is_new_arrival flag once it has expired,
//    so the admin panel and the database stay accurate too.
export const NEW_ARRIVAL_DAYS = 14

const DAY_MS = 24 * 60 * 60 * 1000

/** ISO timestamp of the oldest publish date that still counts as a new arrival. */
export function newArrivalCutoff(now: Date = new Date()): string {
  return new Date(now.getTime() - NEW_ARRIVAL_DAYS * DAY_MS).toISOString()
}

/** True while the product is still inside its 14-day "New" window. */
export function isWithinNewArrivalWindow(
  publishedAt: string | null | undefined,
  createdAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  const start = publishedAt ?? createdAt
  if (!start) return false
  const startMs = Date.parse(start)
  if (Number.isNaN(startMs)) return false
  return now.getTime() - startMs <= NEW_ARRIVAL_DAYS * DAY_MS
}
