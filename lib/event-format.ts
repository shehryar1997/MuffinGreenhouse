// Formatting helpers shared by the public event pages and the admin panel.
// Everything is rendered in Karachi time on both server and client, so a page
// never disagrees with itself between SSR and hydration.
import type { EventType } from "@/types"

const TZ = "Asia/Karachi"

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  workshop: "Workshop",
  tour: "Plant walk",
  market: "Plant market",
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" })
const shortDateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" })
const monthFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, month: "short" })
const dayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric" })
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true })

export const formatEventDate = (iso: string) => dateFmt.format(new Date(iso))
export const formatEventShortDate = (iso: string) => shortDateFmt.format(new Date(iso))
export const formatEventMonth = (iso: string) => monthFmt.format(new Date(iso)).toUpperCase()
export const formatEventDay = (iso: string) => dayFmt.format(new Date(iso))

export function formatEventTime(startIso: string, endIso?: string | null): string {
  const start = timeFmt.format(new Date(startIso))
  return endIso ? `${start} – ${timeFmt.format(new Date(endIso))}` : start
}

export function formatEventPrice(price: number): string {
  return price === 0 ? "Free" : `PKR ${price.toLocaleString("en-PK")}`
}

/** "2026-10-12T14:00" (what <input type="datetime-local"> wants) for an ISO instant, in Karachi time. */
export function toKarachiInputValue(iso: string | null | undefined): string {
  if (!iso) return ""
  // Karachi is UTC+5 all year (no DST).
  const shifted = new Date(new Date(iso).getTime() + 5 * 60 * 60 * 1000)
  return shifted.toISOString().slice(0, 16)
}

/** Inverse of toKarachiInputValue: "2026-10-12T14:00" typed in Karachi time -> ISO instant. */
export function fromKarachiInputValue(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(`${value}:00+05:00`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** Google Calendar "add event" link. */
export function googleCalendarLink(opts: { title: string; startIso: string; endIso?: string | null; location: string; details?: string }): string {
  const compact = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
  const end = opts.endIso ?? new Date(new Date(opts.startIso).getTime() + 2 * 60 * 60 * 1000).toISOString()
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${compact(opts.startIso)}/${compact(end)}`,
    location: opts.location,
    details: opts.details ?? "",
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
