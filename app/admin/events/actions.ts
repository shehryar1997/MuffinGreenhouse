"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { after } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { supabaseAdmin } from "@/supabase/admin-client"
import { isAdminRequest, requireAdmin } from "@/lib/admin-auth"
import { fromKarachiInputValue, slugify } from "@/lib/event-format"
import { isAllowedImageUrl } from "@/lib/image-hosts"
import { sendEventBookingReceivedEmail, sendEventPaymentConfirmedEmail, type EventEmailData } from "@/lib/email/send-event-emails"

/** Sends an e-mail once the response has gone out, and never lets a failed one undo the action it follows. */
function emailAfter(label: string, send: () => Promise<void>) {
  after(async () => {
    try {
      await send()
    } catch (err) {
      console.error(`${label} e-mail failed:`, err)
      Sentry.captureException(err)
    }
  })
}

type EventRow = { title: string; slug: string; datetime: string; end_datetime: string | null; location: string }
const emailEvent = (e: EventRow): EventEmailData["event"] => ({ title: e.title, slug: e.slug, datetime: e.datetime, endDatetime: e.end_datetime, location: e.location })

/** What a save/delete hands back to the form. `undefined` = success (the action redirects). */
export type EventActionResult = { error: string } | undefined

const EVENT_TYPES = ["workshop", "tour", "market"] as const
const EVENT_STATUSES = ["draft", "published", "cancelled"] as const
const PAYMENT_METHODS = ["bank_transfer", "jazzcash", "easypaisa", "cash", "other"] as const

const text = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim()

function intField(fd: FormData, name: string): number | null {
  const raw = text(fd, name)
  if (raw === "") return null
  const n = Number(raw)
  return Number.isInteger(n) ? n : null
}

function refreshPublicPages(slug?: string | null) {
  revalidatePath("/")
  revalidatePath("/events")
  if (slug) revalidatePath(`/events/${slug}`)
  revalidatePath("/admin/events")
}

function parseEvent(fd: FormData): { fields: Record<string, unknown> } | { error: string } {
  const title = text(fd, "title")
  if (title.length < 3) return { error: "Give the event a title (at least 3 characters)." }
  if (title.length > 120) return { error: "The title is too long (120 characters max)." }

  const slug = slugify(text(fd, "slug") || title)
  if (slug.length < 3) return { error: "The URL slug needs at least 3 letters or numbers." }

  const type = text(fd, "type")
  if (!(EVENT_TYPES as readonly string[]).includes(type)) return { error: "Choose what kind of event this is." }

  const status = text(fd, "status")
  if (!(EVENT_STATUSES as readonly string[]).includes(status)) return { error: "Choose a status." }

  const description = text(fd, "description")
  if (description.length < 20) return { error: "Describe the event in a few sentences (at least 20 characters)." }
  if (description.length > 5000) return { error: "The description is too long (5,000 characters max)." }

  const location = text(fd, "location")
  if (location.length < 3) return { error: "Say where the event takes place." }

  const start = fromKarachiInputValue(text(fd, "datetime"))
  if (!start) return { error: "Choose the start date and time." }
  const endRaw = text(fd, "end_datetime")
  const end = endRaw ? fromKarachiInputValue(endRaw) : null
  if (endRaw && !end) return { error: "The end date and time isn't valid." }
  if (end && new Date(end) <= new Date(start)) return { error: "The event has to end after it starts." }

  const price = intField(fd, "price")
  if (price === null || price < 0 || price > 1_000_000) return { error: "Price must be a whole number of rupees (0 for a free event)." }

  const spotsTotal = intField(fd, "spots_total")
  if (spotsTotal === null || spotsTotal < 1 || spotsTotal > 1000) return { error: "Total spots must be a whole number between 1 and 1000." }

  const perBooking = intField(fd, "max_spots_per_booking")
  if (perBooking === null || perBooking < 1 || perBooking > 20) return { error: "Spots per booking must be between 1 and 20." }
  if (perBooking > spotsTotal) return { error: "Spots per booking can't be more than the total spots." }

  const image = text(fd, "image_url")
  if (image && !isAllowedImageUrl(image)) {
    return { error: "That image address isn't from an allowed host. Upload the image with the button instead of pasting a link." }
  }

  const whatToExpect = text(fd, "what_to_expect")
    .split("\n")
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
  if (whatToExpect.length > 12 || whatToExpect.some((line) => line.length > 200)) {
    return { error: "“What to expect” can have at most 12 lines of 200 characters each." }
  }

  return {
    fields: {
      slug,
      title,
      description,
      type,
      status,
      datetime: start,
      end_datetime: end,
      location,
      price,
      spots_total: spotsTotal,
      max_spots_per_booking: perBooking,
      what_to_expect: whatToExpect,
      image_url: image || null,
    },
  }
}

const friendly = (error: { code?: string; message: string }) =>
  error.code === "23505" ? "Another event already uses that URL slug. Change the slug and save again." : error.message

async function reservedSpots(eventId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("event_registrations")
    .select("spots_reserved")
    .eq("event_id", eventId)
    .is("cancelled_at", null)
  return (data ?? []).reduce((sum, r) => sum + (r.spots_reserved as number), 0)
}

export async function createEvent(formData: FormData): Promise<EventActionResult> {
  await requireAdmin()
  const parsed = parseEvent(formData)
  if ("error" in parsed) return { error: parsed.error }

  const { data, error } = await supabaseAdmin
    .from("events")
    .insert({ ...parsed.fields, spots_remaining: parsed.fields.spots_total })
    .select("id, slug")
    .single()
  if (error) return { error: friendly(error) }

  refreshPublicPages(data.slug)
  redirect(`/admin/events/${data.id}`)
}

export async function updateEvent(eventId: string, formData: FormData): Promise<EventActionResult> {
  await requireAdmin()
  const parsed = parseEvent(formData)
  if ("error" in parsed) return { error: parsed.error }

  const { data: existing } = await supabaseAdmin.from("events").select("slug").eq("id", eventId).maybeSingle()
  if (!existing) return { error: "This event no longer exists. It may have been deleted." }

  const reserved = await reservedSpots(eventId)
  if ((parsed.fields.spots_total as number) < reserved) {
    return { error: `${reserved} spots are already booked, so the total can't go below ${reserved}. Cancel some bookings first.` }
  }

  const { error } = await supabaseAdmin.from("events").update(parsed.fields).eq("id", eventId)
  if (error) return { error: friendly(error) }

  refreshPublicPages(existing.slug)
  refreshPublicPages(parsed.fields.slug as string)
  redirect(`/admin/events/${eventId}`)
}

export async function deleteEvent(eventId: string): Promise<EventActionResult> {
  await requireAdmin()
  const { count } = await supabaseAdmin
    .from("event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
  if ((count ?? 0) > 0) {
    return { error: "This event has bookings, so it can't be deleted without losing them. Set its status to “Cancelled” instead." }
  }
  const { data: existing } = await supabaseAdmin.from("events").select("slug").eq("id", eventId).maybeSingle()
  const { error } = await supabaseAdmin.from("events").delete().eq("id", eventId)
  if (error) return { error: error.message }
  refreshPublicPages(existing?.slug)
  redirect("/admin/events")
}

// ---------------------------------------------------------------------------
// Registrations (attendees)
// ---------------------------------------------------------------------------

async function slugForRegistration(registrationId: string): Promise<{ eventId: string; slug: string | null } | null> {
  const { data } = await supabaseAdmin
    .from("event_registrations")
    .select("event_id, event:events(slug)")
    .eq("id", registrationId)
    .maybeSingle()
  if (!data) return null
  const event = data.event as unknown as { slug: string } | null
  return { eventId: data.event_id as string, slug: event?.slug ?? null }
}

/** Mark a booking paid (records how and, optionally, the transfer reference). */
export async function markRegistrationPaid(registrationId: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const method = text(formData, "payment_method")
  const reference = text(formData, "payment_reference").slice(0, 120)
  const { data: reg } = await supabaseAdmin
    .from("event_registrations")
    .select("amount_due, cancelled_at, payment_status, guest_name, guest_email, spots_reserved, reference, event:events(title, slug, datetime, end_datetime, location)")
    .eq("id", registrationId)
    .maybeSingle()
  if (!reg) throw new Error("Booking not found")
  if (reg.cancelled_at) throw new Error("This booking was cancelled, so it can't be marked paid.")

  const { error } = await supabaseAdmin
    .from("event_registrations")
    .update({
      payment_status: "paid",
      amount_paid: reg.amount_due,
      paid_at: new Date().toISOString(),
      payment_method: (PAYMENT_METHODS as readonly string[]).includes(method) ? method : null,
      payment_reference: reference || null,
    })
    .eq("id", registrationId)
  if (error) throw new Error(error.message)

  // Tell the guest their spot is confirmed, if they gave an e-mail. Only the first time: pressing the button
  // again on an already-paid booking must not send it twice.
  const guestEmail = reg.guest_email as string | null
  const event = reg.event as unknown as EventRow | null
  if (guestEmail && event && reg.payment_status !== "paid") {
    emailAfter("Event payment confirmation", () =>
      sendEventPaymentConfirmedEmail({
        toEmail: guestEmail,
        guestName: (reg.guest_name as string | null) ?? "",
        reference: reg.reference as string,
        spots: Number(reg.spots_reserved),
        amountDue: Number(reg.amount_due),
        event: emailEvent(event),
      })
    )
  }

  const ctx = await slugForRegistration(registrationId)
  refreshPublicPages(ctx?.slug)
  revalidatePath(`/admin/events/${ctx?.eventId}`)
}

/** Undo a payment mark, or record a refund. */
export async function setRegistrationPayment(registrationId: string, status: "pending" | "refunded"): Promise<void> {
  await requireAdmin()
  const patch =
    status === "pending"
      ? { payment_status: "pending" as const, amount_paid: 0, paid_at: null, payment_method: null, payment_reference: null }
      : { payment_status: "refunded" as const }
  const { error } = await supabaseAdmin.from("event_registrations").update(patch).eq("id", registrationId)
  if (error) throw new Error(error.message)
  const ctx = await slugForRegistration(registrationId)
  refreshPublicPages(ctx?.slug)
  revalidatePath(`/admin/events/${ctx?.eventId}`)
}

export async function toggleAttended(registrationId: string, attended: boolean): Promise<void> {
  await requireAdmin()
  const { error } = await supabaseAdmin.from("event_registrations").update({ attended }).eq("id", registrationId)
  if (error) throw new Error(error.message)
  const ctx = await slugForRegistration(registrationId)
  revalidatePath(`/admin/events/${ctx?.eventId}`)
}

/** Cancels a booking and frees its spots (the database keeps spots_remaining in step). */
export async function cancelRegistration(registrationId: string): Promise<void> {
  await requireAdmin()
  const { error } = await supabaseAdmin
    .from("event_registrations")
    .update({ cancelled_at: new Date().toISOString(), cancel_reason: "admin" })
    .eq("id", registrationId)
    .is("cancelled_at", null)
  if (error) throw new Error(error.message)
  const ctx = await slugForRegistration(registrationId)
  refreshPublicPages(ctx?.slug)
  revalidatePath(`/admin/events/${ctx?.eventId}`)
}

export async function saveRegistrationNote(registrationId: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const note = text(formData, "admin_notes").slice(0, 1000)
  const { error } = await supabaseAdmin.from("event_registrations").update({ admin_notes: note || null }).eq("id", registrationId)
  if (error) throw new Error(error.message)
  const ctx = await slugForRegistration(registrationId)
  revalidatePath(`/admin/events/${ctx?.eventId}`)
}

export type AddAttendeeState = { error?: string; added?: string } | undefined

/** Manual booking, e.g. someone who reserved over WhatsApp or paid cash on the day. */
export async function addAttendee(eventId: string, _prev: AddAttendeeState, formData: FormData): Promise<AddAttendeeState> {
  if (!(await isAdminRequest())) return { error: "Your admin session has expired. Log in again." }

  const name = text(formData, "guest_name")
  const phone = text(formData, "guest_phone").replace(/[\s-]/g, "")
  const email = text(formData, "guest_email").toLowerCase()
  const spots = intField(formData, "spots") ?? 1
  const paid = formData.get("already_paid") === "on"
  const method = text(formData, "payment_method")

  if (name.length < 2) return { error: "Enter the attendee's name." }
  if (!/^(\+?92|0)?3\d{9}$/.test(phone)) return { error: "Enter a valid Pakistani mobile number, e.g. 0300 1234567." }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That e-mail address doesn't look right." }
  if (spots < 1 || spots > 20) return { error: "Spots must be between 1 and 20." }

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("slug, title, datetime, end_datetime, location, price, spots_remaining")
    .eq("id", eventId)
    .maybeSingle()
  if (!event) return { error: "This event no longer exists." }
  if (event.spots_remaining < spots) {
    return { error: `Only ${event.spots_remaining} spot${event.spots_remaining === 1 ? " is" : "s are"} left. Raise the total spots first, or cancel a booking.` }
  }

  const digits = phone.replace(/\D/g, "")
  const { data: sameNumber } = await supabaseAdmin
    .from("event_registrations")
    .select("id, guest_phone")
    .eq("event_id", eventId)
    .is("cancelled_at", null)
  if ((sameNumber ?? []).some((r) => String(r.guest_phone ?? "").replace(/\D/g, "") === digits)) {
    return { error: "This phone number already has a booking on this event." }
  }

  const amountDue = Number(event.price) * spots
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = "EV-" + Math.random().toString(36).slice(2, 8).toUpperCase()
    const { error } = await supabaseAdmin.from("event_registrations").insert({
      event_id: eventId,
      guest_name: name,
      guest_phone: phone,
      guest_email: email || null,
      spots_reserved: spots,
      amount_due: amountDue,
      amount_paid: paid ? amountDue : 0,
      payment_status: amountDue === 0 || paid ? "paid" : "pending",
      paid_at: paid && amountDue > 0 ? new Date().toISOString() : null,
      payment_method: paid && (PAYMENT_METHODS as readonly string[]).includes(method) ? method : null,
      reference,
    })
    if (!error) {
      refreshPublicPages(event.slug)
      revalidatePath(`/admin/events/${eventId}`)
      // A guest with an e-mail gets the matching one: "you're in" if they already paid, otherwise the booking
      // e-mail (payment instructions for a paid event, a plain confirmation for a free one).
      if (email) {
        const details: EventEmailData = { toEmail: email, guestName: name, reference, spots, amountDue, event: emailEvent(event) }
        if (paid && amountDue > 0) {
          emailAfter("Event payment confirmation", () => sendEventPaymentConfirmedEmail(details))
        } else {
          emailAfter("Event booking", () => sendEventBookingReceivedEmail({ ...details, holdUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) }))
        }
      }
      return { added: `${name} was added (${reference}).${email ? " A confirmation e-mail is on its way." : ""}` }
    }
    if (error.code !== "23505") return { error: error.message }
  }
  return { error: "Couldn't generate a unique booking reference. Please try again." }
}
