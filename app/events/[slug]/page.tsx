import type { Metadata } from "next"
import { getEventBySlug } from "@/lib/data/events"
import { notFound } from "next/navigation"
import EventDetailClient from "./event-detail-client"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = getEventBySlug(slug)
  if (!event) {
    return { title: "Event Not Found" }
  }
  return {
    title: `${event.title}`,
    description: `${event.description} Join us for this plant event in Karachi. Learn plant care, meet fellow enthusiasts, and take home new knowledge. Book now.`,
    alternates: { canonical: `/events/${slug}` },
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = getEventBySlug(slug)
  if (!event) {
    notFound()
  }
  return <EventDetailClient event={event} />
}
