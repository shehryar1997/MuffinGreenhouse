import { Metadata } from "next"
import { getEventBySlug } from "@/lib/data/events"
import { notFound } from "next/navigation"
import EventDetailClient from "./event-detail-client"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const event = getEventBySlug(params.slug)
  if (!event) {
    return { title: "Event Not Found" }
  }
  return {
    title: `${event.title} | My Grow House`,
    description: event.description,
  }
}

export default function EventDetailPage({ params }: { params: { slug: string } }) {
  const event = getEventBySlug(params.slug)
  if (!event) {
    notFound()
  }
  return <EventDetailClient event={event} />
}
