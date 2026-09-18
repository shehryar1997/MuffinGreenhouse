import type { Metadata } from "next"
import { getEventBySlug } from "@/lib/data/events"
import { notFound } from "next/navigation"
import EventDetailClient from "./event-detail-client"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const event = getEventBySlug(params.slug)
  if (!event) {
    return { title: "Event Not Found - Muffin Greenhouse" }
  }
  return {
    title: `${event.title} - Muffin Greenhouse`,
    description: `${event.description} Join us for this plant event in Karachi. Learn plant care, meet fellow enthusiasts, and take home new knowledge. Book now.`,
  }
}

export default function EventDetailPage({ params }: { params: { slug: string } }) {
  const event = getEventBySlug(params.slug)
  if (!event) {
    notFound()
  }
  return <EventDetailClient event={event} />
}
