import type { Metadata } from "next"
import { getUpcomingEvents, getPastEvents } from "@/lib/data/events"
import { EventsPageClient } from "./events-client"

export const metadata: Metadata = {
  title: "Plant Workshops & Events in Karachi",
  description: "Join our repotting workshops, plant walks, and plant parent classes in Karachi. Learn from experts and meet fellow enthusiasts.",
}

export default function EventsPage() {
  const upcoming = getUpcomingEvents()
  const past = getPastEvents()

  return <EventsPageClient upcoming={upcoming} past={past} />
}
