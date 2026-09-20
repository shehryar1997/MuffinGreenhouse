import type { EmailProviderName } from "@/lib/email/limits"
import type { UsageSummary } from "@/lib/email/usage-summary"
import { Alert, Badge, Meter, Panel, type Tone } from "../_components/ui"
import { cn } from "@/lib/utils"

// "E-mails sent" panel for /admin/email: today and this month for each provider, the last 14 days, and the latest
// problem. Plain server-rendered markup (no state), fed by summarizeUsage() over the `email_usage` table.

const NAMES: Record<EmailProviderName, string> = { resend: "Resend", mailtrap: "Mailtrap" }
const BAR: Record<EmailProviderName, string> = { resend: "bg-forest-600", mailtrap: "bg-sky-600" }

interface Props {
  summary: UsageSummary
  limits: Record<EmailProviderName, { daily: number; monthly: number }>
  /** Which providers have their key/token set on the server. */
  configured: Record<EmailProviderName, boolean>
}

const n = (value: number) => value.toLocaleString("en-PK")
const karachi = (iso: string) => new Date(iso).toLocaleString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })

function ProviderRow({ provider, summary, limits, configured }: { provider: EmailProviderName; summary: Props["summary"]; limits: Props["limits"]; configured: boolean }) {
  const usage = summary.providers[provider]
  const limit = limits[provider]
  const full = configured && usage.today >= limit.daily
  const chip: { text: string; tone: Tone } = !configured
    ? { text: "Not connected", tone: "neutral" }
    : full
      ? { text: "Daily limit reached", tone: "danger" }
      : usage.tookOverToday > 0
        ? { text: `Took over ${usage.tookOverToday} today`, tone: "info" }
        : { text: "Active", tone: "success" }

  return (
    <div className="rounded-md border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", BAR[provider])} aria-hidden />
          <span className="font-medium">{NAMES[provider]}</span>
        </div>
        <Badge tone={chip.tone} dot={false}>{chip.text}</Badge>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1.5 flex justify-between text-[13px]">
            <span className="text-muted-foreground">Today</span>
            <span className="font-medium tabular-nums">
              {n(usage.today)} <span className="font-normal text-muted-foreground">/ {n(limit.daily)}</span>
            </span>
          </div>
          <Meter value={usage.today} max={limit.daily} label={`${NAMES[provider]} e-mails today`} tone={BAR[provider]} />
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-[13px]">
            <span className="text-muted-foreground">This month{provider === "mailtrap" ? " (approx.)" : ""}</span>
            <span className="font-medium tabular-nums">
              {n(usage.month)} <span className="font-normal text-muted-foreground">/ {n(limit.monthly)}</span>
            </span>
          </div>
          <Meter value={usage.month} max={limit.monthly} label={`${NAMES[provider]} e-mails this month`} tone={BAR[provider]} />
        </div>
      </div>

      {!configured && (
        <p className="mt-3 text-xs text-amber-800">
          {provider === "mailtrap"
            ? "Add MAILTRAP_API_TOKEN in Vercel to send up to " + n(limit.daily) + " more e-mails a day when Resend is full."
            : "Add RESEND_API_KEY in Vercel."}
        </p>
      )}
      {usage.failedToday > 0 && <p className="mt-3 text-xs text-muted-foreground">{usage.failedToday} attempt{usage.failedToday === 1 ? "" : "s"} refused today.</p>}
    </div>
  )
}

export function EmailUsagePanel({ summary, limits, configured }: Props) {
  const active = (Object.keys(limits) as EmailProviderName[]).filter((p) => configured[p])
  const dailyTotal = active.reduce((sum, p) => sum + limits[p].daily, 0)
  const left = Math.max(0, dailyTotal - summary.totalToday)
  const peak = Math.max(10, ...summary.series.map((d) => d.total))
  const problems = (Object.keys(summary.lastError) as EmailProviderName[]).map((p) => ({ provider: p, ...summary.lastError[p]! }))
  const startedMidMonth = summary.countingSince && !summary.countingSince.endsWith("-01")

  return (
    <Panel title="Sent today" description={`${n(left)} left today across ${active.length === 2 ? "both providers" : "your provider"}`}>
      <p className="text-[26px] font-semibold leading-8 tracking-tight tabular-nums">
        {n(summary.totalToday)}
        <span className="ml-1 text-base font-normal text-muted-foreground">/ {n(dailyTotal)}</span>
      </p>
      <Meter value={summary.totalToday} max={dailyTotal} label="E-mails sent today" className="mt-3" />

      <div className="mt-5 space-y-3">
        <ProviderRow provider="resend" summary={summary} limits={limits} configured={configured.resend} />
        <ProviderRow provider="mailtrap" summary={summary} limits={limits} configured={configured.mailtrap} />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-medium">Last 14 days</p>
          <div className="flex gap-3 text-xs text-muted-foreground">
            {(Object.keys(NAMES) as EmailProviderName[]).map((p) => (
              <span key={p} className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", BAR[p])} aria-hidden /> {NAMES[p]}
              </span>
            ))}
          </div>
        </div>
        <div className="flex h-24 items-end gap-1" role="img" aria-label={`E-mails sent per day over the last 14 days: ${summary.series.map((d) => `${d.day} ${d.total}`).join(", ")}`}>
          {summary.series.map((d) => (
            <div key={d.day} className="flex h-full flex-1 flex-col justify-end" title={`${d.day}: ${d.total} sent (Resend ${d.resend}, Mailtrap ${d.mailtrap})`}>
              <div className="flex flex-col justify-end overflow-hidden rounded-t-sm" style={{ height: `${(d.total / peak) * 100}%` }}>
                <div className={BAR.mailtrap} style={{ height: d.total ? `${(d.mailtrap / d.total) * 100}%` : 0 }} />
                <div className={BAR.resend} style={{ height: d.total ? `${(d.resend / d.total) * 100}%` : 0 }} />
              </div>
              <div className={cn("mt-1 h-0.5 rounded", d.day === summary.today ? "bg-foreground" : "bg-border")} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1 text-center text-[10px] tabular-nums text-muted-foreground">
          {summary.series.map((d) => (
            <span key={d.day} className="flex-1">
              {Number(d.day.slice(8))}
            </span>
          ))}
        </div>
      </div>

      {problems.length > 0 && (
        <Alert tone="warning" title="Latest problems" className="mt-5 text-xs">
          {problems.map((p) => (
            <p key={p.provider}>
              {karachi(p.at)} · {p.message}
            </p>
          ))}
        </Alert>
      )}

      <p className="mt-5 text-xs leading-5 text-muted-foreground">
        A day runs from 00:00 UTC (5:00 am Karachi), which is when Resend resets. Mailtrap doesn&apos;t publish its reset time and counts its month by your
        billing cycle, so its numbers are approximate.
        {startedMidMonth && summary.countingSince ? ` Counting started on ${summary.countingSince}, so this month's totals are lower than the real ones.` : ""}
      </p>
    </Panel>
  )
}
