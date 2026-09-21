"use server"

import { Suspense } from "react"
import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AlertTriangle, BookOpen, CalendarDays, ChevronRight, Clock, Mail, Package, Plus, ShoppingBag, Truck, Wallet } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { isValidSessionCookie, COOKIE_NAME } from "@/lib/admin-session"
import { Panel, PageHeader, StatStrip } from "./_components/ui"
import { fmtNumber, plural, rs } from "./_components/format"
import { AnalyticsPanel, AnalyticsPanelSkeleton } from "./analytics-panel"
import { InsightsPanel } from "./insights-panel"

interface StockRow { stock_count: number; low_stock_threshold: number | null }
interface OrderTotalRow { total: number }

const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000
function getKarachiNow(): Date { return new Date(new Date().getTime() + KARACHI_OFFSET_MS) }
function startOfDayKarachi(d: Date): Date { const k = new Date(d.getTime()); k.setUTCHours(0,0,0,0); return new Date(k.getTime() - KARACHI_OFFSET_MS) }
function startOfMonthKarachi(d: Date): Date { const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); return new Date(m.getTime() - KARACHI_OFFSET_MS) }

const todayLabel = () =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", weekday: "long", day: "numeric", month: "long" }).format(new Date())

const SHORTCUTS = [
  { href: "/admin/products/new", label: "Add a product", icon: Package },
  { href: "/admin/events/new", label: "Create an event", icon: CalendarDays },
  { href: "/admin/journal/new", label: "Write a journal post", icon: BookOpen },
  { href: "/admin/email", label: "Send an email", icon: Mail },
]

export async function AdminDashboardPage() {
  const ck = await cookies()
  if (!isValidSessionCookie(ck.get(COOKIE_NAME)?.value)) redirect("/admin/login")

  const kn = getKarachiNow(), td = startOfDayKarachi(kn).toISOString(), sm = startOfMonthKarachi(kn).toISOString(), to = new Date(kn.getTime() - 12 * 60 * 60 * 1000).toISOString()

  const [r1, r2, r3, r4, r5, r6, r7, r8, r9] = await Promise.all([
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).or("status.eq.pending,payment_status.eq.pending"),
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).or("status.eq.pending,payment_status.eq.pending").lt("created_at", to),
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "paid").or("status.eq.confirmed,status.eq.processing"),
    supabaseAdmin.from("products").select("stock_count,low_stock_threshold").gt("stock_count", 0),
    supabaseAdmin.from("product_variants").select("stock_count,low_stock_threshold").gt("stock_count", 0),
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).gte("created_at", td),
    supabaseAdmin.from("orders").select("total").eq("payment_status", "paid").neq("status", "cancelled").gte("created_at", sm),
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }).eq("status", "published").gt("datetime", new Date().toISOString()),
    supabaseAdmin.from("event_registrations").select("id", { count: "exact", head: true }).eq("payment_status", "pending").gt("amount_due", 0).is("cancelled_at", null),
  ])

  const ap = r1.count ?? 0, op = r2.count ?? 0, ps = r3.count ?? 0
  const lsp = (r4.data ?? []).filter((x: StockRow) => x.stock_count <= (x.low_stock_threshold ?? 5)).length
  const lsv = (r5.data ?? []).filter((x: StockRow) => x.stock_count <= (x.low_stock_threshold ?? 5)).length
  const ot = r6.count ?? 0
  const rm = (r7.data ?? []).reduce((s: number, o: OrderTotalRow) => s + Number(o.total ?? 0), 0)
  const ue = r8.count ?? 0, ep = r9.count ?? 0

  // Work waiting on someone, most urgent first. A zero means nothing to do, and the row says so.
  const queue = [
    { href: "/admin/orders?payment=pending", icon: Clock, count: ap, title: "Orders awaiting payment", detail: op > 0 ? `${op} older than 12 hours` : "Customers who haven't paid yet", urgent: op > 0 },
    { href: "/admin/orders?status=confirmed", icon: Truck, count: ps, title: "Paid orders to ship", detail: "Paid and ready to go out" },
    { href: "/admin/products", icon: AlertTriangle, count: lsp + lsv, title: "Low on stock", detail: `${plural(lsp, "product")} and ${plural(lsv, "variant")}` },
    { href: "/admin/events", icon: Wallet, count: ep, title: "Event bookings awaiting payment", detail: "Spots held until they pay" },
  ]
  const openItems = queue.filter((q) => q.count > 0).length

  return (
    <div>
      <PageHeader title="Dashboard" description={todayLabel()} />

      <StatStrip
        items={[
          { label: "Orders today", value: fmtNumber(ot), href: "/admin/orders" },
          { label: "Revenue this month", value: rs(rm), hint: "Paid orders, not cancelled", href: "/admin/orders?payment=paid" },
          { label: "Upcoming events", value: fmtNumber(ue), href: "/admin/events" },
        ]}
      />

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Panel
          title="Needs attention"
          description={openItems === 0 ? "Nothing is waiting on you." : `${plural(openItems, "thing")} waiting on you.`}
          flush
        >
          <ul className="divide-y divide-border">
            {queue.map((q) => {
              const Icon = q.icon
              return (
                <li key={q.title}>
                  <Link href={q.href} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className={q.count > 0 ? "font-medium text-foreground" : "text-muted-foreground"}>{q.title}</p>
                      <p className={`text-[13px] ${q.urgent ? "text-amber-800" : "text-muted-foreground"}`}>{q.count > 0 ? q.detail : "Nothing waiting"}</p>
                    </div>
                    <span className={`w-10 text-right text-xl font-semibold tabular-nums ${q.count > 0 ? "text-foreground" : "text-muted-foreground/60"}`}>{fmtNumber(q.count)}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel title="Shortcuts" flush>
          <ul className="divide-y divide-border">
            {SHORTCUTS.map((s) => {
              const Icon = s.icon
              return (
                <li key={s.href}>
                  <Link href={s.href} className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/40">
                    <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                    {s.label}
                    <Plus className="ml-auto h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
                  </Link>
                </li>
              )
            })}
            <li>
              <Link href="/admin/orders" className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/40">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                All orders
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
              </Link>
            </li>
          </ul>
        </Panel>
      </div>

      <div className="mt-6">
        <Suspense fallback={null}>
          <InsightsPanel />
        </Suspense>
      </div>

      <div className="mt-6">
        <Suspense fallback={<AnalyticsPanelSkeleton />}>
          <AnalyticsPanel />
        </Suspense>
      </div>
    </div>
  )
}
