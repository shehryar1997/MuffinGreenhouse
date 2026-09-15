// Event data access layer - wraps mock data for easy Supabase migration
import { Event } from "@/types"
import {
  mockEvents,
  getEventBySlug as _getEventBySlug,
  getUpcomingEvents as _getUpcomingEvents,
  getPastEvents as _getPastEvents,
} from "@/data/mock-products"

export { mockEvents }

// ponytail: Wrapper functions that delegate to mock-products.ts
// When we move to Supabase, only these functions need updating

export function getEventBySlug(slug: string): Event | undefined {
  return _getEventBySlug(slug)
}

export function getUpcomingEvents(): Event[] {
  return _getUpcomingEvents()
}

export function getPastEvents(): Event[] {
  return _getPastEvents()
}
