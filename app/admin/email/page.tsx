import { Suspense } from "react"
import { unstable_cache } from "next/cache"
import { countEmailsSentThisMonth } from "@/lib/email/monthly-count"
import { providerStatus } from "@/lib/email/mailer"
import { emailLimits } from "@/lib/email/limits"
import { loadEmailUsage } from "@/lib/email/usage"
import { summarizeUsage } from "@/lib/email/usage-summary"
import { Alert, Meter, PageHeader, Panel } from "../_components/ui"
import { EmailForm } from "./email-form"
import { EmailUsagePanel } from "./usage-panel"

export const dynamic = "force-dynamic"

// The Resend plan allows 100 e-mails a day and 3,000 a month (this card used to compare against 100, so it showed a
// full amber bar from the 101st e-mail). This card is Resend's own count for the month, read from Resend, so it
// includes e-mails sent before the app started keeping its own counters. The "E-mails sent today" panel above it
// covers both providers (see lib/email/mailer.ts and the email_usage table).
const MONTHLY_LIMIT = 3000
const NEAR_LIMIT_AT = 0.8

// Counting pages through Resend's list API at ~600 ms a page (about 18 s near 3,000 e-mails), so reuse the
// result for 5 minutes instead of recounting on every page view.
// ponytail: an in-app counter incremented on every send would be instant; this is the smallest change.
const getMonthlyCount = unstable_cache(() => countEmailsSentThisMonth(), ["resend-monthly-email-count"], { revalidate: 300 })

const TONES = {
  ok: { label: "Within limit", text: "text-forest-700" },
  near: { label: "Near limit", text: "text-amber-800" },
  over: { label: "Limit reached", text: "text-red-700" },
} as const

async function MonthlyUsageCard() {
  const result = await getMonthlyCount()
  const count = result.ok ? result.count : 0
  const status = count >= MONTHLY_LIMIT ? "over" : count >= MONTHLY_LIMIT * NEAR_LIMIT_AT ? "near" : "ok"
  const tone = TONES[status]
  const remainingText =
    status === "over"
      ? `Over the limit by ${(count - MONTHLY_LIMIT).toLocaleString("en-PK")}`
      : `${(MONTHLY_LIMIT - count).toLocaleString("en-PK")} left this month`

  return (
    <Panel title="Resend this month" description="Resend's own count, read straight from Resend">
      {result.ok ? (
        <>
          <p className="text-[26px] font-semibold leading-8 tracking-tight tabular-nums">
            {result.count.toLocaleString("en-PK")}
            {result.capped ? "+" : ""}
            <span className="ml-1 text-base font-normal text-muted-foreground">/ {MONTHLY_LIMIT.toLocaleString("en-PK")}</span>
          </p>
          <Meter value={count} max={MONTHLY_LIMIT} label="Resend e-mails this month" className="mt-3" />
          <div className="mt-2 flex justify-between text-[13px]">
            <span className="text-muted-foreground">{result.monthLabel}</span>
            <span className={`font-medium ${tone.text}`}>{tone.label}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{remainingText} · Resend allows 100 a day</p>
        </>
      ) : (
        <Alert tone="warning" title="Couldn't read the count from Resend">
          {result.error}
        </Alert>
      )}
    </Panel>
  )
}

async function SendingStats() {
  const rows = await loadEmailUsage()
  const status = providerStatus()
  const configured = {
    resend: status.some((p) => p.name === "resend" && p.configured),
    mailtrap: status.some((p) => p.name === "mailtrap" && p.configured),
  }
  return <EmailUsagePanel summary={summarizeUsage(rows)} limits={emailLimits()} configured={configured} />
}

function PanelSkeleton({ height }: { height: string }) {
  return <div className={`animate-pulse rounded-lg border border-border bg-surface ${height}`} aria-hidden />
}

export default function AdminEmailPage() {
  return (
    <div>
      <PageHeader title="Email" description="Send emails directly to customers. Resend goes first, with Mailtrap as an automatic backup." />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <Panel title="Compose" description="Sends to customers from support@muffinplants.com">
          <EmailForm />
        </Panel>

        <div className="space-y-6">
          <Suspense fallback={<PanelSkeleton height="h-36" />}>
            <MonthlyUsageCard />
          </Suspense>
          <Suspense fallback={<PanelSkeleton height="h-96" />}>
            <SendingStats />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
