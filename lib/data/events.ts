// Event data access layer - Supabase backed (public read side).
// Draft events are hidden by RLS (events_read only exposes published + cancelled rows).
import type { Event, EventStatus, EventType } from "@/types"
import { supabase } from "@/supabase/client"

export const EVENT_COLUMNS =
  "id, slug, title, description, type, status, datetime, end_datetime, location, price, spots_total, spots_remaining, max_spots_per_booking, what_to_expect, image_url"

export interface EventRow {
  id: string
  slug: string
  title: string
  description: string
  type: EventType
  status: EventStatus
  datetime: string
  end_datetime: string | null
  location: string
  price: number | string
  spots_total: number
  spots_remaining: number
  max_spots_per_booking: number
  what_to_expect: string[] | null
  image_url: string | null
}

export function mapEventRow(row: EventRow, now: number = Date.now()): Event {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    datetime: row.datetime,
    endDatetime: row.end_datetime,
    location: row.location,
    price: Number(row.price),
    spotsTotal: row.spots_total,
    spotsRemaining: row.spots_remaining,
    maxSpotsPerBooking: row.max_spots_per_booking,
    whatToExpect: row.what_to_expect ?? [],
    image: row.image_url,
    isUpcoming: row.status === "published" && new Date(row.datetime).getTime() > now,
  }
}

/** All visible events, soonest first. */
export async function getPublicEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .in("status", ["published", "cancelled"])
    .order("datetime", { ascending: true })
  if (error) {
    console.error("Error fetching events:", error)
    return []
  }
  const now = Date.now()
  return ((data ?? []) as unknown as EventRow[]).map((row) => mapEventRow(row, now))
}

export async function getUpcomingEvents(): Promise<Event[]> {
  return (await getPublicEvents()).filter((e) => e.isUpcoming)
}

/** Past = already happened, or cancelled. Most recent first. */
export async function getPastEvents(): Promise<Event[]> {
  return (await getPublicEvents())
    .filter((e) => !e.isUpcoming)
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("slug", slug)
    .in("status", ["published", "cancelled"])
    .maybeSingle()
  if (error) {
    console.error("Error fetching event:", error)
    return null
  }
  return data ? mapEventRow(data as unknown as EventRow) : null
}
