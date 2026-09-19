import Link from "next/link"
import { requireAdmin } from "@/lib/admin-auth"
import { EventForm } from "../event-form"
import { createEvent } from "../actions"

export default async function NewEventPage() {
  await requireAdmin()
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">New event</h1>
        <Link href="/admin/events" className="text-sm text-neutral-600 hover:text-neutral-900">
          ← Back to events
        </Link>
      </div>
      <EventForm action={createEvent} submitLabel="Create event" />
    </div>
  )
}
