import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CalendarDays, Clock, Leaf, MapPin, MessageCircle, Sparkles, Users } from "lucide-react"
import { getPastEvents, getUpcomingEvents } from "@/lib/data/events"
import { EventCard, eventStatusLabel } from "@/components/events/event-card"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/nav.config"
import { EVENT_TYPE_LABEL, formatEventDate, formatEventPrice, formatEventTime } from "@/lib/event-format"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Plant Workshops & Events in Karachi",
  description: "Repotting workshops, plant walks and plant-parent classes in Karachi. Small groups, real plants, hands in the soil.",
  alternates: { canonical: "/events" },
}

const whatsappHref = `https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Hi Muffin! Please let me know when the next workshop is announced.")}`

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents()])
  const [next, ...later] = upcoming

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:pt-32">
        <header className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">Calendar</p>
          <h1 className="mb-4 font-serif text-display text-foreground">Workshops &amp; plant walks</h1>
          <p className="text-body-lg text-muted-foreground">
            Small groups, real plants, hands in the soil. Learn from the people who grow them.
          </p>
        </header>

        {next ? (
          <>
            <FeaturedEvent event={next} />

            {later.length > 0 && (
              <section aria-labelledby="also-upcoming" className="mt-16">
                <h2 id="also-upcoming" className="mb-6 font-serif text-heading-2 text-foreground">
                  Also coming up
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {later.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <NoUpcomingEvents />
        )}

        {past.length > 0 && (
          <section aria-labelledby="past-events" className="mt-20">
            <h2 id="past-events" className="mb-6 font-serif text-heading-2 text-foreground">
              Past events
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {past.slice(0, 6).map((event) => (
                <EventCard key={event.id} event={event} past />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function FeaturedEvent({ event }: { event: Awaited<ReturnType<typeof getUpcomingEvents>>[number] }) {
  const status = eventStatusLabel(event)
  const soldOut = event.spotsRemaining === 0

  return (
    <section aria-labelledby="next-event" className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[260px] bg-muted lg:min-h-[420px]">
          {event.image ? (
            <Image src={event.image} alt="" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          ) : (
            <div className="flex h-full min-h-[260px] items-center justify-center">
              <Leaf className="h-16 w-16 text-primary/30" aria-hidden />
            </div>
          )}
          <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-primary shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Next up
          </span>
        </div>

        <div className="flex flex-col justify-center p-7 sm:p-10">
          <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-primary">
            <span>{EVENT_TYPE_LABEL[event.type]}</span>
            {status && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 normal-case tracking-normal">{status.text}</span>
            )}
          </div>
          <h2 id="next-event" className="mb-4 font-serif text-heading-1 text-foreground">
            {event.title}
          </h2>
          <p className="mb-6 line-clamp-4 text-muted-foreground">{event.description}</p>

          <dl className="mb-8 space-y-2.5 text-sm text-foreground">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <dt className="sr-only">Date</dt>
              <dd>{formatEventDate(event.datetime)}</dd>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <dt className="sr-only">Time</dt>
              <dd>{formatEventTime(event.datetime, event.endDatetime)}</dd>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <dt className="sr-only">Where</dt>
              <dd>{event.location}</dd>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <dt className="sr-only">Spots</dt>
              <dd>
                {soldOut ? "Fully booked" : `${event.spotsRemaining} of ${event.spotsTotal} spots open`}
                <span className="text-muted-foreground"> · {formatEventPrice(event.price)}</span>
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/events/${event.slug}`}>
                {soldOut ? "See details" : "Reserve a spot"}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function NoUpcomingEvents() {
  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center sm:px-10">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <CalendarDays className="h-7 w-7 text-primary" aria-hidden />
      </div>
      <h2 className="mb-3 font-serif text-heading-2 text-foreground">Nothing on the calendar yet</h2>
      <p className="mb-8 text-muted-foreground">
        New workshops and plant walks are announced here first, in small groups that fill quickly. Message us and we&apos;ll tell you
        as soon as the next one is open.
      </p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
            Tell me on WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href="https://www.instagram.com/muffinsgreenhouse/" target="_blank" rel="noopener noreferrer">
            Follow on Instagram
          </a>
        </Button>
      </div>
    </section>
  )
}
