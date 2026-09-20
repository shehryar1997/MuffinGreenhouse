// Turns the per-day rows in `email_usage` into what the admin panel shows. Pure (no database, no clock of its own),
// so it can be tested and used from any component.
import type { EmailProviderName } from "./limits"

export interface UsageRow {
  provider: EmailProviderName
  day: string // "YYYY-MM-DD", a UTC day
  sent: number
  failed: number
  took_over: number
  last_error: string | null
  last_error_at: string | null
}

export interface ProviderUsage {
  provider: EmailProviderName
  today: number
  month: number
  tookOverToday: number
  failedToday: number
}

export interface DayBucket {
  day: string
  resend: number
  mailtrap: number
  total: number
}

export interface UsageSummary {
  today: string
  providers: Record<EmailProviderName, ProviderUsage>
  totalToday: number
  /** The last `days` UTC days, oldest first, with days that had no e-mail included as zeros. */
  series: DayBucket[]
  /** The most recent error in the window, per provider. */
  lastError: Partial<Record<EmailProviderName, { message: string; at: string }>>
  /** First day with any data in the current month; later than the 1st means counting started mid-month. */
  countingSince: string | null
}

/** Provider error text with any e-mail address removed, so the stats table never holds customer addresses. */
export function scrubError(message: string): string {
  return message.replace(/[^\s@<>"',;]+@[^\s@<>"',;]+/g, "[e-mail]").slice(0, 300)
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10)

export function summarizeUsage(rows: UsageRow[], now: Date = new Date(), days = 14): UsageSummary {
  const today = dayKey(now)
  const monthPrefix = today.slice(0, 7)
  const blank = (provider: EmailProviderName): ProviderUsage => ({ provider, today: 0, month: 0, tookOverToday: 0, failedToday: 0 })
  const providers = { resend: blank("resend"), mailtrap: blank("mailtrap") }
  const lastError: UsageSummary["lastError"] = {}
  let countingSince: string | null = null

  for (const row of rows) {
    const p = providers[row.provider]
    if (!p) continue
    if (row.day === today) {
      p.today += row.sent
      p.tookOverToday += row.took_over
      p.failedToday += row.failed
    }
    if (row.day.startsWith(monthPrefix)) {
      p.month += row.sent
      if (!countingSince || row.day < countingSince) countingSince = row.day
    }
    if (row.last_error && row.last_error_at) {
      const current = lastError[row.provider]
      if (!current || row.last_error_at > current.at) lastError[row.provider] = { message: row.last_error, at: row.last_error_at }
    }
  }

  const series: DayBucket[] = []
  for (let i = days - 1; i >= 0; i--) {
    const day = dayKey(new Date(now.getTime() - i * 86_400_000))
    const resend = rows.filter((r) => r.provider === "resend" && r.day === day).reduce((n, r) => n + r.sent, 0)
    const mailtrap = rows.filter((r) => r.provider === "mailtrap" && r.day === day).reduce((n, r) => n + r.sent, 0)
    series.push({ day, resend, mailtrap, total: resend + mailtrap })
  }

  return { today, providers, totalToday: providers.resend.today + providers.mailtrap.today, series, lastError, countingSince }
}
