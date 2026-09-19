"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FadeIn, AnimatedHeading } from "@/components/home/shared/animations"
import { mockEvents } from "@/lib/data/events"

export function EventsSection() {
  const events = mockEvents.slice(0, 2)

  return (
    <>
      <section className="py-16 lg:py-20 bg-lime-400">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16">
            <FadeIn>
              <div>
                <span className="font-mono text-xs text-forest-950/60">006</span>
                <span className="mx-2 text-forest-950/30">/</span>
                <span className="font-mono text-xs tracking-widest text-forest-950/60">IN THE GREENHOUSE</span>
                <h2 className="font-serif text-[clamp(2.5rem,6vw,5rem)] text-forest-950 leading-[0.9] tracking-tight mt-8">
                  <AnimatedHeading lines={["Get your", "hands dirty."]} className="text-[clamp(2.5rem,6vw,5rem)]" />
                </h2>
                <p className="text-forest-950/70 mt-6 max-w-xs">Workshops, plant walks, and small rituals for curious people.</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="space-y-8">
                {events.map((event) => (
                  <Link key={event.id} href={`/events/${event.slug}`} className="block border-b border-forest-950/20 pb-8 group hover:opacity-80 transition-opacity">
                    <span className="font-mono text-xs text-clay-500">{event.price === 0 ? "FREE" : `PKR ${event.price}`}</span>
                    <h3 className="font-serif text-xl mt-2 text-forest-950 group-hover:text-clay-500 transition-colors">{event.title}</h3>
                    <p className="font-mono text-xs text-forest-950/60 tracking-widest mt-2 uppercase">{event.location}</p>
                  </Link>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="py-12 bg-lime-400">
        <div className="container mx-auto px-6 lg:px-12">
          <Link href="/events" className="flex items-center justify-between border-t border-forest-950/20 pt-8 group">
            <span className="font-mono text-xs tracking-widest text-forest-950">VIEW ALL EVENTS</span>
            <ArrowRight className="w-4 h-4 text-forest-950 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>
    </>
  )
}
