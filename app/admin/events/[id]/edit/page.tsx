import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { toKarachiInputValue } from "@/lib/event-format"
import { ButtonLink, PageHeader } from "../../../_components/ui"
import { EventForm } from "../../event-form"
import { DeleteEventButton } from "../../delete-event-button"
import { deleteEvent, updateEvent } from "../../actions"

export const dynamic = "force-dynamic"

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const { data: event } = await supabaseAdmin.from("events").select("*").eq("id", id).maybeSingle()
  if (!event) notFound()

  return (
    <div>
      <PageHeader
        title="Edit event"
        description={event.title}
        back={{ href: "/admin/events", label: "Events" }}
        actions={
          <>
            <ButtonLink href={`/admin/events/${id}`}>Attendees</ButtonLink>
            <DeleteEventButton title={event.title} action={deleteEvent.bind(null, id)} />
          </>
        }
      />
      <EventForm
        action={updateEvent.bind(null, id)}
        submitLabel="Save changes"
        values={{
          title: event.title,
          slug: event.slug,
          type: event.type,
          status: event.status,
          description: event.description,
          datetime: toKarachiInputValue(event.datetime),
          end_datetime: toKarachiInputValue(event.end_datetime),
          location: event.location,
          price: Number(event.price),
          spots_total: event.spots_total,
          max_spots_per_booking: event.max_spots_per_booking,
          what_to_expect: ((event.what_to_expect as string[] | null) ?? []).join("\n"),
          image_url: event.image_url,
        }}
      />
    </div>
  )
}
