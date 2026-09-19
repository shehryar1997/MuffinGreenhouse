import Link from "next/link"
import { notFound } from "next/navigation"
import { Download, ExternalLink, Pencil } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { ConfirmSubmitButton } from "@/app/admin/_components/confirm-submit-button"
import { EVENT_TYPE_LABEL, formatEventDate, formatEventPrice, formatEventTime } from "@/lib/event-format"
import { whatsAppLink } from "@/lib/whatsapp-link"
import { nowMs } from "@/lib/now"
import { AddAttendeeForm } from "../add-attendee-form"
import { cancelRegistration, markRegistrationPaid, saveRegistrationNote, setRegistrationPayment, toggleAttended } from "../actions"

export const dynamic = "force-dynamic"

interface Registration {
  id: string
  reference: string
  guest_name: string
  guest_phone: string
  guest_email: string | null
  spots_reserved: number
  amount_due: number
  amount_paid: number
  payment_status: "pending" | "paid" | "failed" | "refunded"
  payment_method: string | null
  payment_reference: string | null
  paid_at: string | null
  attended: boolean
  admin_notes: string | null
  cancel_reason: string | null
  cancelled_at: string | null
  created_at: string
}

type Filter = "all" | "awaiting" | "paid" | "cancelled"

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`
const methodLabel: Record<string, string> = { bank_transfer: "Bank transfer", jazzcash: "JazzCash", easypaisa: "Easypaisa", cash: "Cash", other: "Other" }
const shortWhen = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })

function paymentBadge(r: Registration): { text: string; style: string } {
  if (r.cancelled_at) return { text: r.cancel_reason === "payment_expired" ? "Expired (unpaid)" : "Cancelled", style: "bg-red-50 text-red-700 border-red-200" }
  if (Number(r.amount_due) === 0) return { text: "Free", style: "bg-slate-50 text-slate-600 border-slate-200" }
  if (r.payment_status === "paid") return { text: "Paid", style: "bg-emerald-50 text-emerald-700 border-emerald-200" }
  if (r.payment_status === "refunded") return { text: "Refunded", style: "bg-sky-50 text-sky-700 border-sky-200" }
  return { text: "Awaiting payment", style: "bg-amber-50 text-amber-700 border-amber-200" }
}

export default async function EventAttendeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ filter?: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const { filter: rawFilter } = await searchParams
  const filter: Filter = rawFilter === "awaiting" || rawFilter === "paid" || rawFilter === "cancelled" ? rawFilter : "all"

  const [{ data: event }, { data: regs }] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select("id, slug, title, type, status, datetime, end_datetime, location, price, spots_total, spots_remaining")
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin
      .from("event_registrations")
      .select(
        "id, reference, guest_name, guest_phone, guest_email, spots_reserved, amount_due, amount_paid, payment_status, payment_method, payment_reference, paid_at, attended, admin_notes, cancel_reason, cancelled_at, created_at"
      )
      .eq("event_id", id)
      .order("created_at", { ascending: false }),
  ])
  if (!event) notFound()

  const all = (regs ?? []) as unknown as Registration[]
  const live = all.filter((r) => !r.cancelled_at)
  const awaiting = live.filter((r) => r.payment_status === "pending" && Number(r.amount_due) > 0)
  const paidRegs = live.filter((r) => r.payment_status === "paid" && Number(r.amount_due) > 0)
  const people = live.reduce((s, r) => s + r.spots_reserved, 0)
  const collected = live.reduce((s, r) => s + Number(r.amount_paid || 0), 0)
  const outstanding = awaiting.reduce((s, r) => s + Number(r.amount_due), 0)
  const attended = live.filter((r) => r.attended).reduce((s, r) => s + r.spots_reserved, 0)
  const eventStarted = new Date(event.datetime).getTime() <= nowMs()

  const shown = all.filter((r) => {
    if (filter === "awaiting") return !r.cancelled_at && r.payment_status === "pending" && Number(r.amount_due) > 0
    if (filter === "paid") return !r.cancelled_at && (r.payment_status === "paid" || Number(r.amount_due) === 0)
    if (filter === "cancelled") return !!r.cancelled_at
    return true
  })

  const filters: Array<{ key: Filter; label: string }> = [
    { key: "all", label: `All (${all.length})` },
    { key: "awaiting", label: `Awaiting payment (${awaiting.length})` },
    { key: "paid", label: `Confirmed (${live.length - awaiting.length})` },
    { key: "cancelled", label: `Cancelled (${all.length - live.length})` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/events" className="text-sm text-neutral-600 hover:text-neutral-900">
            ← All events
          </Link>
          <h1 className="text-2xl font-serif font-bold text-neutral-900 mt-2">{event.title}</h1>
          <p className="text-neutral-500 mt-1">
            {EVENT_TYPE_LABEL[event.type as keyof typeof EVENT_TYPE_LABEL]} · {formatEventDate(event.datetime)} · {formatEventTime(event.datetime, event.end_datetime)} · {event.location}
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            {event.status === "draft" ? "Draft: not visible to customers." : event.status === "cancelled" ? "This event is cancelled." : `Live: ${formatEventPrice(Number(event.price))} per person.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.status !== "draft" && (
            <Link href={`/events/${event.slug}`} target="_blank" className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              <ExternalLink className="h-4 w-4" aria-hidden />
              View page
            </Link>
          )}
          <a href={`/admin/events/${id}/export`} className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </a>
          <Link href={`/admin/events/${id}/edit`} className="inline-flex items-center gap-2 px-3 py-2 bg-[#E85D2C] text-white rounded-lg text-sm font-medium hover:bg-[#d45124]">
            <Pencil className="h-4 w-4" aria-hidden />
            Edit event
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Spots booked", value: `${people} / ${event.spots_total}` },
          { label: "Bookings", value: String(live.length) },
          { label: "Collected", value: rs(collected) },
          { label: "Awaiting payment", value: `${rs(outstanding)}`, sub: `${awaiting.length} booking${awaiting.length === 1 ? "" : "s"}`, warn: awaiting.length > 0 },
          { label: "Checked in", value: `${attended} / ${people}` },
        ].map((c) => (
          <div key={c.label} className={`rounded-2xl p-4 border bg-white ${c.warn ? "border-amber-200" : ""}`}>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{c.label}</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1.5">{c.value}</p>
            {c.sub && <p className="text-xs text-amber-700 mt-0.5">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <Link
                key={f.key}
                href={f.key === "all" ? `/admin/events/${id}` : `/admin/events/${id}?filter=${f.key}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f.key ? "bg-[#E85D2C] text-white" : "bg-white border text-neutral-600 hover:bg-neutral-50"}`}
              >
                {f.label}
              </Link>
            ))}
          </div>

          {shown.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed p-10 text-center text-sm text-neutral-500">
              {all.length === 0 ? "No bookings yet. They appear here as customers reserve spots, or add one yourself." : "Nothing matches this filter."}
            </div>
          ) : (
            <ul className="space-y-3">
              {shown.map((r) => {
                const badge = paymentBadge(r)
                const cancelled = !!r.cancelled_at
                const waMessage =
                  Number(r.amount_due) > 0 && r.payment_status === "pending" && !cancelled
                    ? `Hi ${r.guest_name.split(" ")[0]}! This is Muffin Greenhouse about "${event.title}" (${r.reference}). We're holding your spot. Please send ${rs(Number(r.amount_due))} and share the receipt here to confirm.`
                    : `Hi ${r.guest_name.split(" ")[0]}! This is Muffin Greenhouse about "${event.title}" (${r.reference}).`
                const wa = whatsAppLink(r.guest_phone, waMessage)
                return (
                  <li key={r.id} className={`bg-white rounded-lg border p-4 ${cancelled ? "opacity-60" : ""}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-neutral-900">
                          {r.guest_name}{" "}
                          <span className="text-xs font-mono text-neutral-400">{r.reference}</span>
                        </p>
                        <p className="text-sm text-neutral-600">
                          {r.guest_phone}
                          {r.guest_email ? ` · ${r.guest_email}` : ""}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {r.spots_reserved} {r.spots_reserved === 1 ? "person" : "people"} · {Number(r.amount_due) === 0 ? "Free" : rs(Number(r.amount_due))} · booked {shortWhen.format(new Date(r.created_at))}
                        </p>
                      </div>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.style}`}>{badge.text}</span>
                    </div>

                    {r.payment_status === "paid" && Number(r.amount_due) > 0 && !cancelled && (
                      <p className="text-xs text-neutral-500 mt-2">
                        Paid{r.payment_method ? ` via ${methodLabel[r.payment_method] ?? r.payment_method}` : ""}
                        {r.payment_reference ? ` · ref ${r.payment_reference}` : ""}
                        {r.paid_at ? ` · ${shortWhen.format(new Date(r.paid_at))}` : ""}
                      </p>
                    )}

                    {!cancelled && (
                      <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2">
                        {Number(r.amount_due) > 0 && r.payment_status !== "paid" && r.payment_status !== "refunded" && (
                          <details className="relative">
                            <summary className="cursor-pointer list-none px-3 py-1.5 rounded bg-[#E85D2C] text-white text-sm font-medium hover:bg-[#d45124]">Mark paid</summary>
                            <form action={markRegistrationPaid.bind(null, r.id)} className="absolute z-10 mt-2 w-64 rounded-lg border bg-white p-3 shadow-lg space-y-2">
                              <select name="payment_method" defaultValue="bank_transfer" className="w-full border rounded px-2 py-1.5 text-sm">
                                {Object.entries(methodLabel).map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                              <input name="payment_reference" placeholder="Receipt / transaction ref (optional)" className="w-full border rounded px-2 py-1.5 text-sm" />
                              <button type="submit" className="w-full px-3 py-1.5 rounded bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800">
                                Confirm payment of {rs(Number(r.amount_due))}
                              </button>
                            </form>
                          </details>
                        )}
                        {r.payment_status === "paid" && Number(r.amount_due) > 0 && (
                          <>
                            <form action={setRegistrationPayment.bind(null, r.id, "pending")}>
                              <ConfirmSubmitButton message="Mark this booking as unpaid again?" className="px-3 py-1.5 rounded border bg-white text-sm hover:bg-neutral-50">
                                Mark unpaid
                              </ConfirmSubmitButton>
                            </form>
                            <form action={setRegistrationPayment.bind(null, r.id, "refunded")}>
                              <ConfirmSubmitButton message="Record this booking as refunded? (Cancel it afterwards to free the spots.)" className="px-3 py-1.5 rounded border bg-white text-sm hover:bg-neutral-50">
                                Refunded
                              </ConfirmSubmitButton>
                            </form>
                          </>
                        )}
                        <form action={toggleAttended.bind(null, r.id, !r.attended)}>
                          <button type="submit" className={`px-3 py-1.5 rounded border text-sm ${r.attended ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white hover:bg-neutral-50"}`}>
                            {r.attended ? "✓ Checked in" : eventStarted ? "Check in" : "Check in (event day)"}
                          </button>
                        </form>
                        {wa && (
                          <a href={wa} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded bg-[#25D366] text-white text-sm font-medium hover:bg-[#128C7E]">
                            WhatsApp
                          </a>
                        )}
                        <form action={cancelRegistration.bind(null, r.id)} className="ml-auto">
                          <ConfirmSubmitButton
                            message={`Cancel ${r.guest_name}'s booking? Their ${r.spots_reserved} spot${r.spots_reserved === 1 ? "" : "s"} will be released. No e-mail is sent, so message them yourself.`}
                            className="px-3 py-1.5 rounded border border-red-200 bg-white text-sm text-red-700 hover:bg-red-50"
                          >
                            Cancel booking
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    )}

                    <form action={saveRegistrationNote.bind(null, r.id)} className="mt-3 flex gap-2">
                      <input name="admin_notes" defaultValue={r.admin_notes ?? ""} maxLength={1000} placeholder="Private note (dietary needs, plant they're bringing…)" className="flex-1 border rounded px-2 py-1.5 text-sm" />
                      <button type="submit" className="px-3 py-1.5 rounded border bg-white text-sm hover:bg-neutral-50">
                        Save note
                      </button>
                    </form>
                  </li>
                )
              })}
            </ul>
          )}

          {paidRegs.length > 0 && awaiting.length === 0 && (
            <p className="text-xs text-neutral-500">All payments received.</p>
          )}
        </div>

        <aside className="bg-white rounded-lg border p-5">
          <h2 className="text-lg font-serif mb-1">Add an attendee</h2>
          <p className="text-xs text-neutral-500 mb-4">For bookings made on WhatsApp, Instagram or in person.</p>
          <AddAttendeeForm eventId={id} price={Number(event.price)} spotsLeft={event.spots_remaining} />
        </aside>
      </div>
    </div>
  )
}
