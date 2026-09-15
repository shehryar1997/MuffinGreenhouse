"use client"

import { motion } from "framer-motion"
import { Calendar, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Event } from "@/types"

interface EventCardProps {
  event: Event
}

function EventCard({ event }: EventCardProps) {
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

interface EventsGridProps {
  events: Event[]
  isPast?: boolean
}

export default function EventsGrid({ events, isPast = false }: EventsGridProps) {
  if (events.length === 0) return null

  return (
    <section className={isPast ? "pb-20" : "mb-16"}>
      <h2 className="font-serif text-heading-2 text-forest-900 mb-6">
        {isPast ? "Past Events" : "Upcoming"}
      </h2>
      <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 ${isPast ? "opacity-60" : ""}`}>
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  )
}
