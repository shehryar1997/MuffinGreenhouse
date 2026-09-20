import Link from "next/link"
import { Plus } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { EVENT_TYPE_LABEL, formatEventShortDate, formatEventTime } from "@/lib/event-format"
import type { EventType } from "@/types"
import { nowMs } from "@/lib/now"
import { Badge, ButtonLink, EmptyState, FilterTabs, PageHeader, StatStrip, TableShell, Td, Th, Thead, Tr, rowLinkClass, type Tone } from "../_components/ui"
import { fmtNumber, rs } from "../_components/format"

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

function StatusPill({ status, past }: { status: Row["status"]; past: boolean }) {
  const [label, tone]: [string, Tone] =
    status === "draft" ? ["Draft", "neutral"] : status === "cancelled" ? ["Cancelled", "danger"] : past ? ["Finished", "neutral"] : ["Live", "success"]
  return <Badge tone={tone}>{label}</Badge>
}

const EMPTY: Record<Tab, { title: string; description: string }> = {
  upcoming: { title: "No upcoming events", description: "Create one and publish it to open bookings." },
  past: { title: "No past events yet", description: "Finished and cancelled events collect here." },
  drafts: { title: "No drafts", description: "Events you haven't published yet collect here." },
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
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "drafts", label: "Drafts" },
  ]

  return (
    <div>
      <PageHeader
        title="Events"
        description="Workshops, plant walks and markets: create them, take bookings and track payments."
        actions={
          <ButtonLink href="/admin/events/new" variant="primary">
            <Plus className="h-4 w-4" aria-hidden />
            New event
          </ButtonLink>
        }
      />

      <StatStrip
        items={[
          { label: "Upcoming events", value: fmtNumber(upcomingLive.length) },
          { label: "Spots booked", value: fmtNumber(spotsBooked) },
          {
            label: "Awaiting payment",
            value: fmtNumber(awaitingPayment.length),
            hint: awaitingPayment.length > 0 ? "Spots are held for 24 hours" : undefined,
            warn: awaitingPayment.length > 0,
          },
          { label: "Collected, all events", value: rs(collected) },
        ]}
      />

      <div className="mb-4 mt-8">
        <FilterTabs
          label="Events"
          items={tabs.map((t) => ({
            href: t.key === "upcoming" ? "/admin/events" : `/admin/events?tab=${t.key}`,
            label: t.label,
            count: groups[t.key].length,
            active: tab === t.key,
          }))}
        />
      </div>

      {shown.length === 0 ? (
        <EmptyState title={EMPTY[tab].title} description={EMPTY[tab].description} />
      ) : (
        <TableShell minWidth="min-w-[760px]">
          <Thead>
            <tr>
              <Th>Event</Th>
              <Th>When</Th>
              <Th>Booked</Th>
              <Th>Payments</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </Thead>
          <tbody>
            {shown.map((r) => {
              const live = active(r)
              const booked = live.reduce((s, g) => s + g.spots_reserved, 0)
              const due = live.reduce((s, g) => s + Number(g.amount_due || 0), 0)
              const paid = live.reduce((s, g) => s + Number(g.amount_paid || 0), 0)
              const unpaid = live.filter((g) => g.payment_status === "pending" && Number(g.amount_due) > 0).length
              return (
                <Tr key={r.id}>
                  <Td>
                    <Link href={`/admin/events/${r.id}`} className={rowLinkClass}>
                      {r.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {EVENT_TYPE_LABEL[r.type]} · {Number(r.price) === 0 ? "Free" : rs(r.price)}
                    </p>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {formatEventShortDate(r.datetime)}
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatEventTime(r.datetime, r.end_datetime)}</p>
                  </Td>
                  <Td>
                    <span className="font-medium tabular-nums">
                      {booked} <span className="font-normal text-muted-foreground">/ {r.spots_total}</span>
                    </span>
                    <div
                      className="mt-1.5 h-1 w-24 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label="Spots booked"
                      aria-valuenow={booked}
                      aria-valuemin={0}
                      aria-valuemax={r.spots_total}
                    >
                      <div className="h-full rounded-full bg-forest-600" style={{ width: `${Math.min(100, (booked / r.spots_total) * 100)}%` }} />
                    </div>
                  </Td>
                  <Td>
                    {due === 0 ? (
                      <span className="text-muted-foreground">{Number(r.price) === 0 ? "Free event" : "No bookings"}</span>
                    ) : (
                      <>
                        <span className="font-medium tabular-nums">{rs(paid)}</span>
                        <span className="text-muted-foreground tabular-nums"> of {rs(due)}</span>
                        {unpaid > 0 && <p className="mt-0.5 text-xs text-amber-800">{unpaid} awaiting payment</p>}
                      </>
                    )}
                  </Td>
                  <Td>
                    <StatusPill status={r.status} past={isPast(r)} />
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <ButtonLink href={`/admin/events/${r.id}`} size="sm">
                        Attendees
                      </ButtonLink>
                      <ButtonLink href={`/admin/events/${r.id}/edit`} size="sm" variant="ghost">
                        Edit
                      </ButtonLink>
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  )
}
