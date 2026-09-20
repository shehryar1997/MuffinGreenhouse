import { notFound } from "next/navigation"
import { Check, Download, ExternalLink, MessageCircle, Pencil } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { ConfirmSubmitButton } from "@/app/admin/_components/confirm-submit-button"
import { Badge, ButtonLink, EmptyState, FilterTabs, PageHeader, Panel, StatStrip, buttonClass, inputClass, waButtonClass, type Tone } from "@/app/admin/_components/ui"
import { rs } from "@/app/admin/_components/format"
import { EVENT_TYPE_LABEL, formatEventDate, formatEventPrice, formatEventTime } from "@/lib/event-format"
import { whatsAppLink } from "@/lib/whatsapp-link"
import { nowMs } from "@/lib/now"
import { cn } from "@/lib/utils"
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

const methodLabel: Record<string, string> = { bank_transfer: "Bank transfer", jazzcash: "JazzCash", easypaisa: "Easypaisa", cash: "Cash", other: "Other" }
const shortWhen = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })

function paymentBadge(r: Registration): { text: string; tone: Tone } {
  if (r.cancelled_at) return { text: r.cancel_reason === "payment_expired" ? "Expired (unpaid)" : "Cancelled", tone: "danger" }
  if (Number(r.amount_due) === 0) return { text: "Free", tone: "neutral" }
  if (r.payment_status === "paid") return { text: "Paid", tone: "success" }
  if (r.payment_status === "refunded") return { text: "Refunded", tone: "info" }
  return { text: "Awaiting payment", tone: "warning" }
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

  const filters: Array<{ key: Filter; label: string; count: number }> = [
    { key: "all", label: "All", count: all.length },
    { key: "awaiting", label: "Awaiting payment", count: awaiting.length },
    { key: "paid", label: "Confirmed", count: live.length - awaiting.length },
    { key: "cancelled", label: "Cancelled", count: all.length - live.length },
  ]

  const statusBadge =
    event.status === "draft" ? <Badge>Draft · hidden from customers</Badge> : event.status === "cancelled" ? <Badge tone="danger">Cancelled</Badge> : <Badge tone="success">Live · {formatEventPrice(Number(event.price))} per person</Badge>

  return (
    <div>
      <PageHeader
        title={event.title}
        description={`${EVENT_TYPE_LABEL[event.type as keyof typeof EVENT_TYPE_LABEL]} · ${formatEventDate(event.datetime)} · ${formatEventTime(event.datetime, event.end_datetime)} · ${event.location}`}
        back={{ href: "/admin/events", label: "All events" }}
        badges={statusBadge}
        actions={
          <>
            {event.status !== "draft" && (
              <ButtonLink href={`/events/${event.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4" aria-hidden />
                View page
              </ButtonLink>
            )}
            <a href={`/admin/events/${id}/export`} className={buttonClass()}>
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </a>
            <ButtonLink href={`/admin/events/${id}/edit`} variant="primary">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit event
            </ButtonLink>
          </>
        }
      />

      <StatStrip
        items={[
          { label: "Spots booked", value: `${people} / ${event.spots_total}` },
          { label: "Bookings", value: live.length },
          { label: "Collected", value: rs(collected) },
          {
            label: "Awaiting payment",
            value: rs(outstanding),
            hint: `${awaiting.length} booking${awaiting.length === 1 ? "" : "s"}`,
            warn: awaiting.length > 0,
          },
          { label: "Checked in", value: `${attended} / ${people}` },
        ]}
      />

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <FilterTabs
            label="Bookings"
            items={filters.map((f) => ({
              href: f.key === "all" ? `/admin/events/${id}` : `/admin/events/${id}?filter=${f.key}`,
              label: f.label,
              count: f.count,
              active: filter === f.key,
            }))}
          />

          {shown.length === 0 ? (
            <EmptyState
              title={all.length === 0 ? "No bookings yet" : "Nothing matches this filter"}
              description={all.length === 0 ? "They appear here as customers reserve spots, or add one yourself." : undefined}
            />
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
              {shown.map((r) => {
                const badge = paymentBadge(r)
                const cancelled = !!r.cancelled_at
                const waMessage =
                  Number(r.amount_due) > 0 && r.payment_status === "pending" && !cancelled
                    ? `Hi ${r.guest_name.split(" ")[0]}! This is Muffin Greenhouse about "${event.title}" (${r.reference}). We're holding your spot. Please send ${rs(Number(r.amount_due))} and share the receipt here to confirm.`
                    : `Hi ${r.guest_name.split(" ")[0]}! This is Muffin Greenhouse about "${event.title}" (${r.reference}).`
                const wa = whatsAppLink(r.guest_phone, waMessage)
                return (
                  <li key={r.id} className={cn("p-5", cancelled && "bg-muted/30")}>
                    <div className={cn("flex flex-wrap items-start justify-between gap-3", cancelled && "opacity-70")}>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {r.guest_name}{" "}
                          <span className="ml-1 font-mono text-xs font-normal text-muted-foreground">{r.reference}</span>
                        </p>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {r.guest_phone}
                          {r.guest_email ? ` · ${r.guest_email}` : ""}
                        </p>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {r.spots_reserved} {r.spots_reserved === 1 ? "person" : "people"} · {Number(r.amount_due) === 0 ? "Free" : rs(Number(r.amount_due))} · booked {shortWhen.format(new Date(r.created_at))}
                        </p>
                      </div>
                      <Badge tone={badge.tone}>{badge.text}</Badge>
                    </div>

                    {r.payment_status === "paid" && Number(r.amount_due) > 0 && !cancelled && (
                      <p className="mt-2 text-[13px] text-muted-foreground">
                        Paid{r.payment_method ? ` via ${methodLabel[r.payment_method] ?? r.payment_method}` : ""}
                        {r.payment_reference ? ` · ref ${r.payment_reference}` : ""}
                        {r.paid_at ? ` · ${shortWhen.format(new Date(r.paid_at))}` : ""}
                      </p>
                    )}

                    {!cancelled && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {Number(r.amount_due) > 0 && r.payment_status !== "paid" && r.payment_status !== "refunded" && (
                          <details className="relative">
                            <summary className={cn(buttonClass({ variant: "primary", size: "sm" }), "cursor-pointer")}>Mark paid</summary>
                            <form action={markRegistrationPaid.bind(null, r.id)} className="absolute left-0 z-10 mt-2 w-72 space-y-2 rounded-lg border border-border bg-surface p-3 shadow-lg">
                              <select name="payment_method" aria-label="Payment method" defaultValue="bank_transfer" className={inputClass}>
                                {Object.entries(methodLabel).map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                              <input name="payment_reference" aria-label="Receipt or transaction reference" placeholder="Receipt / transaction ref (optional)" className={inputClass} />
                              <button type="submit" className={buttonClass({ variant: "primary", size: "sm", className: "w-full" })}>
                                Confirm payment of {rs(Number(r.amount_due))}
                              </button>
                            </form>
                          </details>
                        )}
                        {r.payment_status === "paid" && Number(r.amount_due) > 0 && (
                          <>
                            <form action={setRegistrationPayment.bind(null, r.id, "pending")}>
                              <ConfirmSubmitButton title="Mark as unpaid?" confirmLabel="Mark unpaid" message="Mark this booking as unpaid again?" className={buttonClass({ size: "sm" })}>
                                Mark unpaid
                              </ConfirmSubmitButton>
                            </form>
                            <form action={setRegistrationPayment.bind(null, r.id, "refunded")}>
                              <ConfirmSubmitButton
                                title="Record as refunded?"
                                confirmLabel="Record refund"
                                message="Record this booking as refunded? (Cancel it afterwards to free the spots.)"
                                className={buttonClass({ size: "sm" })}
                              >
                                Refunded
                              </ConfirmSubmitButton>
                            </form>
                          </>
                        )}
                        <form action={toggleAttended.bind(null, r.id, !r.attended)}>
                          <button
                            type="submit"
                            className={cn(buttonClass({ size: "sm" }), r.attended && "border-forest-300 bg-forest-50 text-forest-800 hover:bg-forest-100")}
                          >
                            {r.attended && <Check className="h-3.5 w-3.5" aria-hidden />}
                            {r.attended ? "Checked in" : eventStarted ? "Check in" : "Check in (event day)"}
                          </button>
                        </form>
                        {wa && (
                          <a href={wa} target="_blank" rel="noopener noreferrer" className={cn(waButtonClass, "h-8 px-3 text-[13px]")}>
                            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                            WhatsApp
                          </a>
                        )}
                        <form action={cancelRegistration.bind(null, r.id)} className="ml-auto">
                          <ConfirmSubmitButton
                            title={`Cancel ${r.guest_name}'s booking?`}
                            confirmLabel="Cancel booking"
                            cancelLabel="Keep booking"
                            tone="danger"
                            message={`Their ${r.spots_reserved} spot${r.spots_reserved === 1 ? "" : "s"} will be released. No e-mail is sent, so message them yourself.`}
                            className={buttonClass({ variant: "danger", size: "sm" })}
                          >
                            Cancel booking
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    )}

                    <form action={saveRegistrationNote.bind(null, r.id)} className="mt-3 flex gap-2">
                      <input
                        name="admin_notes"
                        aria-label={`Private note for ${r.guest_name}`}
                        defaultValue={r.admin_notes ?? ""}
                        maxLength={1000}
                        placeholder="Private note (dietary needs, plant they're bringing…)"
                        className={cn(inputClass, "h-8 flex-1 text-[13px]")}
                      />
                      <button type="submit" className={buttonClass({ size: "sm" })}>
                        Save note
                      </button>
                    </form>
                  </li>
                )
              })}
            </ul>
          )}

          {paidRegs.length > 0 && awaiting.length === 0 && <p className="text-[13px] text-muted-foreground">All payments received.</p>}
        </div>

        <Panel title="Add an attendee" description="For bookings made on WhatsApp, Instagram or in person.">
          <AddAttendeeForm eventId={id} price={Number(event.price)} spotsLeft={event.spots_remaining} />
        </Panel>
      </div>
    </div>
  )
}
