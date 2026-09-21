import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { getGaReport, isGaReportConfigured, type GaReport } from "@/lib/ga-report"
import { Panel } from "./_components/ui"
import { fmtNumber } from "./_components/format"

const dayLabel = (yyyymmdd: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T00:00:00Z`)
  )

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">no earlier week to compare</span>
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 ${value >= 0 ? "text-forest-700" : "text-red-700"}`}>
      <Icon className="h-3 w-3" aria-hidden />
      {Math.abs(value)}% vs. week before
    </span>
  )
}

function Body({ r }: { r: GaReport }) {
  const peak = Math.max(1, ...r.days.map((d) => d.users))
  return (
    <div className="grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <dl className="grid grid-cols-3 gap-4">
          {[
            { label: "Visitors", value: r.users, change: r.usersChange },
            { label: "Page views", value: r.views, change: r.viewsChange },
            { label: "Sessions", value: r.sessions, change: undefined },
          ].map((s) => (
            <div key={s.label}>
              <dt className="text-[13px] text-muted-foreground">{s.label}</dt>
              <dd className="mt-1 text-[26px] font-semibold leading-8 tracking-tight tabular-nums text-foreground">{fmtNumber(s.value)}</dd>
              {s.change !== undefined && <p className="mt-1 text-xs"><Change value={s.change} /></p>}
            </div>
          ))}
        </dl>

        {r.days.length > 0 && (
          <div className="mt-5" role="img" aria-label={`Daily visitors: ${r.days.map((d) => `${dayLabel(d.date)} ${d.users}`).join(", ")}`}>
            <div className="flex h-14 items-end gap-1.5">
              {r.days.map((d) => (
                <div key={d.date} title={`${dayLabel(d.date)}: ${d.users} visitors`} className="min-w-0 flex-1 rounded-sm bg-forest-600/80" style={{ height: `${Math.max(4, (d.users / peak) * 100)}%` }} />
              ))}
            </div>
            <div className="mt-1.5 flex gap-1.5 text-[11px] text-muted-foreground">
              {r.days.map((d) => (
                <span key={d.date} className="min-w-0 flex-1 truncate text-center">{dayLabel(d.date).split(" ")[0]}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-[13px] font-medium text-foreground">Most viewed pages</p>
        {r.pages.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No page views recorded yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {r.pages.map((p) => (
              <li key={p.path} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                <span className="min-w-0 truncate text-foreground" title={p.path}>{p.path}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{fmtNumber(p.views)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export async function AnalyticsPanel() {
  const title = "Website traffic"
  const description = "Last 7 days, from Google Analytics"

  if (!isGaReportConfigured()) {
    return (
      <Panel title={title} description={description}>
        <p className="text-sm text-muted-foreground">
          Not connected yet. Add <code className="rounded bg-muted px-1 py-0.5 text-xs">GA_PROPERTY_ID</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">GA_SERVICE_ACCOUNT_EMAIL</code> and{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">GA_SERVICE_ACCOUNT_PRIVATE_KEY</code> to the environment to show traffic here.
        </p>
      </Panel>
    )
  }

  let report: GaReport
  try {
    report = await getGaReport()
  } catch (err) {
    console.error("[admin] Google Analytics report failed:", err)
    return (
      <Panel title={title} description={description}>
        <p className="text-sm text-amber-800">Couldn&apos;t load Google Analytics right now. The rest of the dashboard is unaffected.</p>
      </Panel>
    )
  }

  return (
    <Panel title={title} description={description}>
      <Body r={report} />
    </Panel>
  )
}

export function AnalyticsPanelSkeleton() {
  return (
    <Panel title="Website traffic" description="Last 7 days, from Google Analytics">
      <div className="h-[9.5rem] animate-pulse rounded-md bg-muted/60" aria-hidden />
    </Panel>
  )
}
