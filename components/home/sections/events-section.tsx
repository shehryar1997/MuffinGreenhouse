"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FadeIn, AnimatedHeading } from "@/components/home/shared/animations"
import { mockEvents } from "@/lib/data/events"

export function EventsSection() {
  const events = mockEvents.slice(0, 2)

  return (
    <>
      <section className="py-16 lg:py-20 bg-[#D4F542]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16">
            <FadeIn>
              <div>
                <span className="font-mono text-xs text-[#1A1A1A]/60">006</span>
                <span className="mx-2 text-[#1A1A1A]/30">/</span>
                <span className="font-mono text-xs tracking-widest text-[#1A1A1A]/60">IN THE GREENHOUSE</span>
                <h2 className="font-serif text-[clamp(2.5rem,6vw,5rem)] text-[#1A1A1A] leading-[0.9] tracking-tight mt-8">
                  <AnimatedHeading lines={["Get your", "hands dirty."]} className="text-[clamp(2.5rem,6vw,5rem)]" />
                </h2>
                <p className="text-[#1A1A1A]/70 mt-6 max-w-xs">Workshops, plant walks, and small rituals for curious people.</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="space-y-8">
                {events.map((event) => (
                  <Link key={event.id} href={`/events/${event.slug}`} className="block border-b border-[#1A1A1A]/20 pb-8 group hover:opacity-80 transition-opacity">
                    <span className="font-mono text-xs text-[#E85A3C]">{event.price === 0 ? "FREE" : `PKR ${event.price}`}</span>
                    <h3 className="font-serif text-xl mt-2 text-[#1A1A1A] group-hover:text-[#E85A3C] transition-colors">{event.title}</h3>
                    <p className="font-mono text-[10px] text-[#1A1A1A]/60 tracking-widest mt-2 uppercase">{event.location}</p>
                  </Link>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#D4F542]">
        <div className="container mx-auto px-6 lg:px-12">
          <Link href="/events" className="flex items-center justify-between border-t border-[#1A1A1A]/20 pt-8 group">
            <span className="font-mono text-xs tracking-widest text-[#1A1A1A]">VIEW ALL EVENTS</span>
            <ArrowRight className="w-4 h-4 text-[#1A1A1A] group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>
    </>
  )
}
