import { requireAdmin } from "@/lib/admin-auth"
import { PageHeader } from "../../_components/ui"
import { EventForm } from "../event-form"
import { createEvent } from "../actions"

export default async function NewEventPage() {
  await requireAdmin()
  return (
    <div>
      <PageHeader title="New event" back={{ href: "/admin/events", label: "Events" }} />
      <EventForm action={createEvent} submitLabel="Create event" />
    </div>
  )
}
