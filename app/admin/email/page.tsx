import { Suspense } from "react"
import { unstable_cache } from "next/cache"
import { Send, BarChart3, Clock, AlertCircle } from "lucide-react"
import { countEmailsSentThisMonth } from "@/lib/email/monthly-count"
import { EmailForm } from "./email-form"

export const dynamic = "force-dynamic"

// The Resend plan allows 3,000 e-mails a month. This card used to compare against 100, so it showed a full amber
// bar from the 101st e-mail.
const MONTHLY_LIMIT = 3000
const NEAR_LIMIT_AT = 0.8

// Counting pages through Resend's list API at ~600 ms a page (about 18 s near 3,000 e-mails), so reuse the
// result for 5 minutes instead of recounting on every page view.
// ponytail: an in-app counter incremented on every send would be instant; this is the smallest change.
const getMonthlyCount = unstable_cache(() => countEmailsSentThisMonth(), ["resend-monthly-email-count"], { revalidate: 300 })

const TONES = {
  ok: { label: "Within limit", text: "text-emerald-600", iconBg: "bg-emerald-100", bar: "bg-emerald-500" },
  near: { label: "Near limit", text: "text-amber-600", iconBg: "bg-amber-100", bar: "bg-amber-500" },
  over: { label: "Limit reached", text: "text-red-600", iconBg: "bg-red-100", bar: "bg-red-500" },
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
    <div className="bg-gradient-to-br from-white to-neutral-50 rounded-2xl p-6 border border-neutral-200 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" />
            Monthly Usage
          </p>
          <p className="text-3xl font-bold text-neutral-900 mt-2">
            {result.ok ? (
              <>
                {result.count.toLocaleString("en-PK")}
                {result.capped ? "+" : ""}
                <span className="ml-1 text-lg font-medium text-neutral-400">/ {MONTHLY_LIMIT.toLocaleString("en-PK")}</span>
              </>
            ) : (
              <span className="text-amber-600">-</span>
            )}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${tone.iconBg}`}>
          {result.ok ? (
            <BarChart3 className={`h-5 w-5 ${tone.text}`} />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-600" />
          )}
        </div>
      </div>
      <div className="space-y-2">
        {result.ok ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">{result.monthLabel}</span>
              <span className={`font-medium ${tone.text}`}>
                {tone.label}
              </span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
                style={{ width: `${Math.min((count / MONTHLY_LIMIT) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-neutral-400">
              {remainingText} · Sends from support@muffinplants.com via Resend
            </p>
          </>
        ) : (
          <p role="alert" className="text-sm text-amber-700 bg-amber-50 p-3 rounded-xl">
            {result.error}
          </p>
        )}
      </div>
    </div>
  )
}

export default function AdminEmailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-neutral-900">Email</h1>
        <p className="text-neutral-500 mt-1">Send emails directly to customers via Resend</p>
      </div>

      <Suspense
        fallback={
          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center gap-3 text-neutral-400">
              <Clock className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading monthly usage...</span>
            </div>
          </div>
        }
      >
        <MonthlyUsageCard />
      </Suspense>

      <div className="bg-gradient-to-br from-white to-neutral-50 rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-[#3f6b3f]/5 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#3f6b3f]/10 flex items-center justify-center">
              <Send className="h-4 w-4 text-[#3f6b3f]" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900">Compose Email</h2>
              <p className="text-xs text-neutral-500">Sends to customers from support@muffinplants.com</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <EmailForm />
        </div>
      </div>
    </div>
  )
}
