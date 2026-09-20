import { Mail } from "lucide-react"
import type { EmailProviderName } from "@/lib/email/limits"
import type { UsageSummary } from "@/lib/email/usage-summary"

// "E-mails sent" card for /admin/email: today and this month for each provider, the last 14 days, and the latest
// problem. Plain server-rendered markup (no state), fed by summarizeUsage() over the `email_usage` table.

const NAMES: Record<EmailProviderName, string> = { resend: "Resend", mailtrap: "Mailtrap" }
const BAR: Record<EmailProviderName, string> = { resend: "bg-emerald-500", mailtrap: "bg-sky-500" }

interface Props {
  summary: UsageSummary
  limits: Record<EmailProviderName, { daily: number; monthly: number }>
  /** Which providers have their key/token set on the server. */
  configured: Record<EmailProviderName, boolean>
}

const n = (value: number) => value.toLocaleString("en-PK")
const karachi = (iso: string) => new Date(iso).toLocaleString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })

function Bar({ value, max, tone }: { value: number; max: number; tone: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-2 overflow-hidden rounded-full bg-neutral-200" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : tone}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function ProviderRow({ provider, summary, limits, configured }: { provider: EmailProviderName; summary: Props["summary"]; limits: Props["limits"]; configured: boolean }) {
  const usage = summary.providers[provider]
  const limit = limits[provider]
  const full = configured && usage.today >= limit.daily
  const chip = !configured
    ? { text: "Not connected", cls: "bg-neutral-100 text-neutral-600" }
    : full
      ? { text: "Daily limit reached", cls: "bg-red-100 text-red-700" }
      : usage.tookOverToday > 0
        ? { text: `Took over ${usage.tookOverToday} today`, cls: "bg-sky-100 text-sky-700" }
        : { text: "Active", cls: "bg-emerald-100 text-emerald-700" }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${BAR[provider]}`} aria-hidden />
          <span className="font-semibold text-neutral-900">{NAMES[provider]}</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${chip.cls}`}>{chip.text}</span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-neutral-500">Today</span>
            <span className="font-medium text-neutral-900">
              {n(usage.today)} <span className="font-normal text-neutral-400">/ {n(limit.daily)}</span>
            </span>
          </div>
          <Bar value={usage.today} max={limit.daily} tone={BAR[provider]} />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-neutral-500">This month{provider === "mailtrap" ? " (approx.)" : ""}</span>
            <span className="font-medium text-neutral-900">
              {n(usage.month)} <span className="font-normal text-neutral-400">/ {n(limit.monthly)}</span>
            </span>
          </div>
          <Bar value={usage.month} max={limit.monthly} tone={BAR[provider]} />
        </div>
      </div>

      {!configured && (
        <p className="mt-3 text-xs text-amber-700">
          {provider === "mailtrap"
            ? "Add MAILTRAP_API_TOKEN in Vercel to send up to " + n(limit.daily) + " more e-mails a day when Resend is full."
            : "Add RESEND_API_KEY in Vercel."}
        </p>
      )}
      {usage.failedToday > 0 && <p className="mt-3 text-xs text-neutral-500">{usage.failedToday} attempt{usage.failedToday === 1 ? "" : "s"} refused today.</p>}
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
    <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
            <Mail className="h-3.5 w-3.5" />
            E-mails sent today
          </p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">
            {n(summary.totalToday)}
            <span className="ml-1 text-lg font-medium text-neutral-400">/ {n(dailyTotal)}</span>
          </p>
          <p className="mt-1 text-sm text-neutral-500">{n(left)} left today across {active.length === 2 ? "both providers" : "your provider"}</p>
        </div>
      </div>
      <Bar value={summary.totalToday} max={dailyTotal} tone="bg-emerald-500" />

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <ProviderRow provider="resend" summary={summary} limits={limits} configured={configured.resend} />
        <ProviderRow provider="mailtrap" summary={summary} limits={limits} configured={configured.mailtrap} />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Last 14 days</p>
          <div className="flex gap-3 text-xs text-neutral-500">
            {(Object.keys(NAMES) as EmailProviderName[]).map((p) => (
              <span key={p} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${BAR[p]}`} aria-hidden /> {NAMES[p]}
              </span>
            ))}
          </div>
        </div>
        <div className="flex h-24 items-end gap-1.5" role="img" aria-label={`E-mails sent per day over the last 14 days: ${summary.series.map((d) => `${d.day} ${d.total}`).join(", ")}`}>
          {summary.series.map((d) => (
            <div key={d.day} className="flex h-full flex-1 flex-col justify-end" title={`${d.day}: ${d.total} sent (Resend ${d.resend}, Mailtrap ${d.mailtrap})`}>
              <div className="flex flex-col justify-end overflow-hidden rounded-t" style={{ height: `${(d.total / peak) * 100}%` }}>
                <div className={BAR.mailtrap} style={{ height: d.total ? `${(d.mailtrap / d.total) * 100}%` : 0 }} />
                <div className={BAR.resend} style={{ height: d.total ? `${(d.resend / d.total) * 100}%` : 0 }} />
              </div>
              <div className={`mt-1 h-0.5 rounded ${d.day === summary.today ? "bg-neutral-800" : "bg-neutral-200"}`} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1.5 text-center text-[10px] text-neutral-400">
          {summary.series.map((d) => (
            <span key={d.day} className="flex-1">
              {Number(d.day.slice(8))}
            </span>
          ))}
        </div>
      </div>

      {problems.length > 0 && (
        <div className="mt-5 space-y-1 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          <p className="font-medium">Latest problems</p>
          {problems.map((p) => (
            <p key={p.provider}>
              {karachi(p.at)} · {p.message}
            </p>
          ))}
        </div>
      )}

      <p className="mt-5 text-xs text-neutral-400">
        A day runs from 00:00 UTC (5:00 am Karachi), which is when Resend resets. Mailtrap doesn&apos;t publish its reset time and counts its month by your
        billing cycle, so its numbers are approximate.
        {startedMidMonth && summary.countingSince ? ` Counting started on ${summary.countingSince}, so this month's totals are lower than the real ones.` : ""}
      </p>
    </div>
  )
}
