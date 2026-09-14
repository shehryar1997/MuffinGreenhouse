"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, MapPin, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockEvents } from "@/data/mock-products"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default function EventDetailPage({ params }: { params: { slug: string } }) {
  const event = mockEvents.find(e => e.slug === params.slug)
  const [reserved, setReserved] = useState(false)

  if (!event) return notFound()

  const date = new Date(event.datetime)
  const timeStr = `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")} ${date.getHours() >= 12 ? "PM" : "AM"}`

  if (reserved) {
    return (
      <div className="bg-cream-100 min-h-screen py-20">
        <div className="container mx-auto px-4 max-w-xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-cream-200 rounded-3xl p-12"
          >
            <div className="w-20 h-20 bg-sprout-300/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-sprout-300" />
            </div>
            <h1 className="font-serif text-heading-1 text-forest-900 mb-2">You're registered!</h1>
            <p className="text-forest-600 mb-4">{event.title}</p>
            <p className="text-sm text-forest-500 mb-8">
              A confirmation has been sent to your WhatsApp.
            </p>
            <Button asChild><Link href="/events">Browse More</Link></Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-cream-100 min-h-screen pb-20">
      <div className="relative h-[50vh] min-h-[400px]">
        <Image src={event.image} alt={event.title} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-900/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 container mx-auto">
          <Badge variant={event.price === 0 ? "success" : "default"} className="mb-4">
            {event.price === 0 ? "Free" : `PKR ${event.price}`}
          </Badge>
          <h1 className="font-serif text-display text-white max-w-2xl">{event.title}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-cream-200 rounded-2xl p-6">
              <h2 className="font-serif text-2xl text-forest-900 mb-3">About</h2>
              <p className="text-forest-700 leading-relaxed">{event.description}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-forest-200/50">
              <h3 className="font-medium text-forest-900 mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-clay-500" />
                  <span className="text-forest-700">{date.toLocaleDateString("en-PK", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-clay-500" />
                  <span className="text-forest-700">{timeStr} — {event.spotsRemaining} spots left</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-clay-500" />
                  <span className="text-forest-700">{event.location}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-cream-200 rounded-2xl p-6 h-fit">
            <h3 className="font-serif text-xl text-forest-900 mb-6">Reserve</h3>
            <form onSubmit={(e) => { e.preventDefault(); setReserved(true) }} className="space-y-4">
              <input type="text" placeholder="Your name" className="w-full px-4 py-3 bg-white border-2 border-forest-200 rounded-xl" required />
              <input type="tel" placeholder="03XX-XXXXXXX" className="w-full px-4 py-3 bg-white border-2 border-forest-200 rounded-xl" required />
              <Button type="submit" className="w-full">{event.price === 0 ? "Reserve Free" : `Pay PKR ${event.price}`}</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
