import Link from "next/link"
import { CalendarDays, Clock, Plus, Users, Wallet } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { EVENT_TYPE_LABEL, formatEventShortDate, formatEventTime } from "@/lib/event-format"
import type { EventType } from "@/types"
import { nowMs } from "@/lib/now"

export const dynamic = "force-dynamic"

type Tab = "upcoming" | "past" | "drafts"

interface Row {
  id: string
  slug: string
  title: string
  type: EventType
  status: "draft" | "published" | "cancelled"
  datetime: string
  end_datetime: string | null
  price: number
  spots_total: number
  spots_remaining: number
  event_registrations: Array<{
    spots_reserved: number
    amount_due: number
    amount_paid: number
    payment_status: string
    cancelled_at: string | null
  }>
}

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`

function StatusPill({ status, past }: { status: Row["status"]; past: boolean }) {
  const label = status === "draft" ? "Draft" : status === "cancelled" ? "Cancelled" : past ? "Finished" : "Live"
  const style =
    status === "draft"
      ? "bg-slate-50 text-slate-600 border-slate-200"
      : status === "cancelled"
        ? "bg-red-50 text-red-700 border-red-200"
        : past
          ? "bg-neutral-50 text-neutral-600 border-neutral-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200"
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>{label}</span>
}

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin()
  const { tab: rawTab } = await searchParams
  const tab: Tab = rawTab === "past" || rawTab === "drafts" ? rawTab : "upcoming"

  const { data, error } = await supabaseAdmin
    .from("events")
    .select(
      "id, slug, title, type, status, datetime, end_datetime, price, spots_total, spots_remaining, event_registrations(spots_reserved, amount_due, amount_paid, payment_status, cancelled_at)"
    )
    .order("datetime", { ascending: false })
  if (error) console.error("Error loading events:", error)

  const now = nowMs()
  const rows = (data ?? []) as unknown as Row[]
  const isPast = (r: Row) => new Date(r.datetime).getTime() <= now || r.status === "cancelled"
  const groups: Record<Tab, Row[]> = {
    upcoming: rows.filter((r) => r.status === "published" && !isPast(r)).sort((a, b) => +new Date(a.datetime) - +new Date(b.datetime)),
    past: rows.filter((r) => r.status !== "draft" && isPast(r)),
    drafts: rows.filter((r) => r.status === "draft"),
  }
  const shown = groups[tab]

  const active = (r: Row) => r.event_registrations.filter((g) => !g.cancelled_at)
  const upcomingLive = groups.upcoming
  const awaitingPayment = upcomingLive.flatMap(active).filter((g) => g.payment_status === "pending" && Number(g.amount_due) > 0)
  const spotsBooked = upcomingLive.reduce((sum, r) => sum + active(r).reduce((s, g) => s + g.spots_reserved, 0), 0)
  const collected = rows.flatMap(active).reduce((s, g) => s + Number(g.amount_paid || 0), 0)

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "upcoming", label: `Upcoming (${groups.upcoming.length})` },
    { key: "past", label: `Past (${groups.past.length})` },
    { key: "drafts", label: `Drafts (${groups.drafts.length})` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-neutral-900">Events</h1>
          <p className="text-neutral-500 mt-1">Workshops, plant walks and markets: create them, take bookings and track payments.</p>
        </div>
        <Link href="/admin/events/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#E85D2C] text-white rounded-lg hover:bg-[#d45124] text-sm font-medium shrink-0">
          <Plus className="h-4 w-4" aria-hidden />
          New event
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Upcoming events", value: String(upcomingLive.length), icon: CalendarDays },
          { label: "Spots booked", value: String(spotsBooked), icon: Users },
          { label: "Awaiting payment", value: String(awaitingPayment.length), icon: Clock, warn: awaitingPayment.length > 0 },
          { label: "Collected (all events)", value: rs(collected), icon: Wallet },
        ].map((c) => (
          <div key={c.label} className={`rounded-2xl p-5 border bg-white ${c.warn ? "border-amber-200" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{c.label}</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{c.value}</p>
              </div>
              <c.icon className="h-5 w-5 text-neutral-400" aria-hidden />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "upcoming" ? "/admin/events" : `/admin/events?tab=${t.key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.key ? "bg-[#E85D2C] text-white" : "bg-white border text-neutral-600 hover:bg-neutral-50"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium text-neutral-900">
            {tab === "upcoming" ? "No upcoming events" : tab === "past" ? "No past events yet" : "No drafts"}
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            {tab === "upcoming" ? "Create one and publish it to open bookings." : "Nothing to show here."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-neutral-50 text-left text-sm font-medium text-neutral-600">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Booked</th>
                <th className="px-4 py-3">Payments</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {shown.map((r) => {
                const live = active(r)
                const booked = live.reduce((s, g) => s + g.spots_reserved, 0)
                const due = live.reduce((s, g) => s + Number(g.amount_due || 0), 0)
                const paid = live.reduce((s, g) => s + Number(g.amount_paid || 0), 0)
                const unpaid = live.filter((g) => g.payment_status === "pending" && Number(g.amount_due) > 0).length
                return (
                  <tr key={r.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/events/${r.id}`} className="font-medium text-neutral-900 hover:text-[#E85D2C]">
                        {r.title}
                      </Link>
                      <p className="text-xs text-neutral-500">
                        {EVENT_TYPE_LABEL[r.type]} · {Number(r.price) === 0 ? "Free" : `Rs ${Number(r.price).toLocaleString("en-PK")}`}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatEventShortDate(r.datetime)}
                      <p className="text-xs text-neutral-500">{formatEventTime(r.datetime, r.end_datetime)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">
                        {booked} / {r.spots_total}
                      </span>
                      <div className="mt-1 h-1.5 w-24 rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full bg-[#E85D2C]" style={{ width: `${Math.min(100, (booked / r.spots_total) * 100)}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {due === 0 ? (
                        <span className="text-neutral-500">{Number(r.price) === 0 ? "Free event" : "No bookings"}</span>
                      ) : (
                        <>
                          <span className="font-medium">{rs(paid)}</span>
                          <span className="text-neutral-500"> of {rs(due)}</span>
                          {unpaid > 0 && <p className="text-xs text-amber-700">{unpaid} awaiting payment</p>}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} past={isPast(r)} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link href={`/admin/events/${r.id}`} className="text-[#E85D2C] hover:underline mr-4">
                        Attendees
                      </Link>
                      <Link href={`/admin/events/${r.id}/edit`} className="text-neutral-600 hover:text-neutral-900">
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
