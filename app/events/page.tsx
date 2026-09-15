import { getUpcomingEvents, getPastEvents } from "@/lib/data/events"
import EventsGrid from "./events-grid"

export default function EventsPage() {
  const upcoming = getUpcomingEvents()
  const past = getPastEvents()

  return (
    <div className="bg-cream-100 min-h-screen">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="pt-32 pb-20 text-center">
          <p className="font-mono text-sm text-forest-500 mb-2">Calendar</p>
          <h1 className="font-serif text-display text-forest-900 mb-4">Events & Workshops</h1>
          <p className="text-forest-600 text-body-lg max-w-xl mx-auto">
            Learn, connect, and get your hands dirty. Most events at our DHA pickup point.
          </p>
        </div>

        <EventsGrid events={upcoming} />
        <EventsGrid events={past} isPast />
      </div>
    </div>
  )
}
