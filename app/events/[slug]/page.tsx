import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarDays, Clock, Leaf, MapPin, Sparkles } from "lucide-react"
import { getEventBySlug } from "@/lib/data/events"
import { createServerClient } from "@/lib/supabase/server-client"
import { EVENT_TYPE_LABEL, formatEventDate, formatEventPrice, formatEventTime } from "@/lib/event-format"
import { serializeJsonLd } from "@/lib/structured-data"
import { RegistrationCard } from "./registration-card"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  if (!event) return { title: "Event not found" }
  return {
    title: event.title,
    description: `${event.description.slice(0, 150).trim()} ${formatEventDate(event.datetime)}, Karachi.`.trim(),
    alternates: { canonical: `/events/${slug}` },
    openGraph: event.image ? { images: [event.image] } : undefined,
  }
}

// Signed-in customers get their details pre-filled; everyone else books as a guest.
async function getPrefill() {
  try {
    const supabase = createServerClient(await cookies())
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return undefined
    const { data } = await supabase.from("customers").select("name, phone, email").eq("auth_id", user.id).maybeSingle()
    if (!data) return undefined
    return { name: data.name ?? "", phone: data.phone ?? "", email: data.email ?? "" }
  } catch {
    return undefined
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  if (!event) notFound()

  const prefill = await getPrefill()
  const paragraphs = event.description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.datetime,
    ...(event.endDatetime ? { endDate: event.endDatetime } : {}),
    eventStatus: event.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: event.location, address: { "@type": "PostalAddress", addressLocality: "Karachi", addressCountry: "PK" } },
    ...(event.image ? { image: [event.image] } : {}),
    offers: {
      "@type": "Offer",
      price: event.price,
      priceCurrency: "PKR",
      availability: event.spotsRemaining > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
    organizer: { "@type": "Organization", name: "Muffin Greenhouse" },
  }

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <div className="container mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6 lg:pt-28">
        <Link
          href="/events"
          className="mb-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All events
        </Link>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <div className="relative mb-8 aspect-[16/10] overflow-hidden rounded-3xl bg-muted">
              {event.image ? (
                <Image src={event.image} alt="" fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Leaf className="h-20 w-20 text-primary/30" aria-hidden />
                </div>
              )}
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-xs lg:text-[11px] uppercase tracking-widest text-primary">
              <span>{EVENT_TYPE_LABEL[event.type]}</span>
              <span aria-hidden>·</span>
              <span>{formatEventPrice(event.price)}</span>
              {event.status === "cancelled" && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 normal-case tracking-normal text-destructive">Cancelled</span>
              )}
            </div>
            <h1 className="mb-6 font-serif text-heading-1 text-foreground">{event.title}</h1>

            <dl className="mb-8 grid gap-3 rounded-2xl border border-border bg-card p-5 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-mono text-xs lg:text-[11px] uppercase tracking-wider text-muted-foreground">Date</dt>
                  <dd className="text-foreground">{formatEventDate(event.datetime)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-mono text-xs lg:text-[11px] uppercase tracking-wider text-muted-foreground">Time</dt>
                  <dd className="text-foreground">{formatEventTime(event.datetime, event.endDatetime)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-mono text-xs lg:text-[11px] uppercase tracking-wider text-muted-foreground">Where</dt>
                  <dd className="text-foreground">{event.location}</dd>
                </div>
              </div>
            </dl>

            <div className="space-y-4 text-body-lg text-foreground/85">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {event.whatToExpect.length > 0 && (
              <section className="mt-10 rounded-2xl border border-border bg-muted/40 p-6" aria-labelledby="what-to-expect">
                <h2 id="what-to-expect" className="mb-4 flex items-center gap-2 font-serif text-xl text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                  What to expect
                </h2>
                <ul className="space-y-2.5 text-sm text-foreground/80">
                  {event.whatToExpect.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="lg:col-span-5">
            <RegistrationCard event={event} prefill={prefill} />
          </aside>
        </div>
      </div>
    </div>
  )
}
