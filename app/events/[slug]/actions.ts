"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { supabaseAdmin } from "@/supabase/admin-client"
import { createServerClient } from "@/lib/supabase/server-client"
import { allowHit, callerIp } from "@/lib/db-rate-limit"

export type RegisterForEventResult =
  | { ok: true; reference: string; amountDue: number; spots: number; free: boolean }
  | { ok: false; error: string }

const schema = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^(\+?92|0)?3\d{9}$/.test(v), "Please enter a valid Pakistani mobile number, e.g. 0300 1234567"),
  email: z
    .string()
    .trim()
    .max(254)
    .optional()
    .transform((v) => (v ? v.toLowerCase() : ""))
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "That e-mail address doesn't look right"),
  spots: z.coerce.number().int().min(1).max(20),
})

const DB_ERRORS: Record<string, string> = {
  EVENT_NOT_FOUND: "This event isn't open for booking any more.",
  REGISTRATION_CLOSED: "This event has already started, so booking is closed.",
  INVALID_SPOTS: "That's more spots than one booking allows for this event.",
  INVALID_CONTACT: "Please check your name and WhatsApp number.",
  ALREADY_REGISTERED: "This number is already booked on this event. Message us on WhatsApp if you'd like to change your booking.",
  NOT_ENOUGH_SPOTS: "There aren't enough spots left for that many people. Try fewer guests.",
}

export async function registerForEvent(input: {
  eventId: string
  name: string
  phone: string
  email?: string
  spots: number
}): Promise<RegisterForEventResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details and try again." }
  }
  const { eventId, name, phone, email, spots } = parsed.data

  // Bookings are free to make, so cap how fast one address can make them.
  const ip = await callerIp()
  if (!(await allowHit(`event-register:${ip}`, 6, 10 * 60))) {
    return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." }
  }

  // Link the booking to the account when someone is signed in (never trust an id from the browser).
  let customerId: string | null = null
  try {
    const supabase = createServerClient(await cookies())
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabaseAdmin.from("customers").select("id").eq("auth_id", user.id).maybeSingle()
      customerId = data?.id ?? null
    }
  } catch {
    // Not signed in / bad cookie: book as a guest.
  }

  const { data, error } = await supabaseAdmin.rpc("register_for_event", {
    p_event_id: eventId,
    p_name: name,
    p_phone: phone,
    p_email: email || null,
    p_spots: spots,
    p_customer_id: customerId,
  })

  if (error) {
    const code = Object.keys(DB_ERRORS).find((k) => error.message.includes(k))
    if (code) return { ok: false, error: DB_ERRORS[code] }
    console.error("register_for_event failed:", error)
    return { ok: false, error: "Something went wrong while booking. Please try again, or message us on WhatsApp." }
  }

  const result = data as { reference: string; amount_due: number | string; spots: number; free: boolean }

  const { data: event } = await supabaseAdmin.from("events").select("slug").eq("id", eventId).maybeSingle()
  if (event?.slug) revalidatePath(`/events/${event.slug}`)
  revalidatePath("/events")
  revalidatePath("/admin/events")

  return {
    ok: true,
    reference: result.reference,
    amountDue: Number(result.amount_due),
    spots: result.spots,
    free: result.free,
  }
}
