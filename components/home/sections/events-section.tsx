"use client"

import Link from "next/link"
import { ArrowRight, CalendarDays, MapPin } from "lucide-react"
import { FadeIn, AnimatedHeading } from "@/components/home/shared/animations"
import { SectionLabel } from "@/components/home/shared/section-label"
import { formatEventDay, formatEventMonth, formatEventPrice } from "@/lib/event-format"
import type { Event } from "@/types"

export function EventsSection({ events, n }: { events: Event[]; n: string }) {
  return (
    <section className="bg-sprout-100 py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <FadeIn>
          <SectionLabel n={n} label="In the greenhouse" />
        </FadeIn>

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="font-serif leading-[0.92] tracking-tight">
              <AnimatedHeading lines={["Get your", "hands dirty."]} className="text-[clamp(2.75rem,7vw,5.5rem)] text-forest-950" />
            </h2>
            <FadeIn delay={0.15}>
              <p className="mt-6 max-w-sm text-lg text-forest-700">Workshops, plant walks, and small rituals for curious people.</p>
              <Link
                href="/events"
                className="group mt-8 inline-flex items-center gap-3 rounded-full bg-forest-950 px-6 py-3.5 font-mono text-xs uppercase tracking-widest text-cream-50 transition hover:-translate-y-0.5 hover:bg-clay-500 hover:text-white"
              >
                {events.length > 0 ? "View all events" : "See the calendar"}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </FadeIn>
          </div>

          <FadeIn delay={0.1} className="lg:col-span-7">
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group flex items-stretch gap-5 rounded-3xl border border-forest-200/60 bg-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:gap-6 sm:p-5"
                  >
                    <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-forest-950 py-3 text-cream-50 sm:w-24">
                      <span className="font-mono text-[11px] uppercase tracking-widest text-sprout-300">{formatEventMonth(event.datetime)}</span>
                      <span className="font-serif text-4xl leading-none sm:text-5xl">{formatEventDay(event.datetime)}</span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <span className="font-mono text-xs uppercase tracking-widest text-clay-600">{formatEventPrice(event.price)}</span>
                      <h3 className="mt-1 font-serif text-xl leading-tight text-forest-950 transition-colors group-hover:text-clay-600 sm:text-2xl">{event.title}</h3>
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-forest-600">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{event.location}</span>
                      </p>
                    </div>
                    <ArrowRight className="hidden h-5 w-5 shrink-0 self-center text-forest-400 transition-all group-hover:translate-x-1 group-hover:text-clay-600 sm:block" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-5 rounded-3xl border border-dashed border-forest-300 bg-surface/60 p-6 sm:p-8">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest-950 text-sprout-300">
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-clay-600">Coming soon</span>
                  <h3 className="mt-1 font-serif text-2xl text-forest-950">The next workshop is being planned.</h3>
                  <p className="mt-2 max-w-md text-forest-600">Small groups, real plants. Follow along and be first to know when spots open.</p>
                </div>
              </div>
            )}
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
