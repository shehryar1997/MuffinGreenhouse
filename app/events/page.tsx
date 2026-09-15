"use client"

import { motion } from "framer-motion"
import { Clock, MapPin, Users, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockEvents, getUpcomingEvents, getPastEvents } from "@/data/mock-products"
import Link from "next/link"
import Image from "next/image"

export default function EventsPage() {
  const upcoming = getUpcomingEvents()
  const past = getPastEvents()

  return (
    <div className="bg-cream-100 min-h-screen">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-32 pb-20 text-center">
          <p className="font-mono text-sm text-forest-500 mb-2">Calendar</p>
          <h1 className="font-serif text-display text-forest-900 mb-4">Events & Workshops</h1>
          <p className="text-forest-600 text-body-lg max-w-xl mx-auto">
            Learn, connect, and get your hands dirty. Most events at our DHA pickup point.
          </p>
        </motion.div>

        {/* Upcoming Events */}
        {upcoming.length > 0 && (
          <section className="mb-16">
            <h2 className="font-serif text-heading-2 text-forest-900 mb-6">Upcoming</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Past Events */}
        {past.length > 0 && (
          <section className="pb-20">
            <h2 className="font-serif text-heading-2 text-forest-900 mb-6">Past Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
              {past.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function EventCard({ event }: { event: typeof mockEvents[0] }) {
  const date = new Date(event.datetime)

  return (
    <Link href={`/events/${event.slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-cream-200 rounded-2xl overflow-hidden border border-forest-200/50 group"
      >
        <div className="relative h-48 overflow-hidden">
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4">
            <Badge variant={event.price === 0 ? "success" : "default"}>
              {event.price === 0 ? "Free" : `PKR ${event.price}`}
            </Badge>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-forest-500 mb-2">
            <Calendar className="w-4 h-4" />
            <span>{date.toLocaleDateString("en-PK", { weekday: "long", month: "short", day: "numeric" })}</span>
          </div>
          <h3 className="font-serif text-xl text-forest-900 mb-2 group-hover:text-clay-500 transition-colors">
            {event.title}
          </h3>
          <p className="text-forest-600 text-sm line-clamp-2 mb-4">{event.description}</p>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-forest-500">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{event.location.split(",")[0]}</span>
            </div>
            <div className={`font-mono ${event.spotsRemaining < 5 ? "text-clay-500" : "text-forest-500"}`}>
              {event.spotsRemaining} spots
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
