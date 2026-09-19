import { Suspense } from "react"
import { Mail, Send, BarChart3, Clock, AlertCircle } from "lucide-react"
import { countEmailsSentThisMonth } from "@/lib/email/monthly-count"
import { EmailForm } from "./email-form"

export const dynamic = "force-dynamic"

async function MonthlyUsageCard() {
  const result = await countEmailsSentThisMonth()
  const isCapped = result.ok && (result.capped || result.count > 100)

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
              </>
            ) : (
              <span className="text-amber-600">-</span>
            )}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${isCapped ? "bg-amber-100" : "bg-emerald-100"}`}>
          {result.ok ? (
            <BarChart3 className={`h-5 w-5 ${isCapped ? "text-amber-600" : "text-emerald-600"}`} />
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
              <span className={`font-medium ${isCapped ? "text-amber-600" : "text-emerald-600"}`}>
                {isCapped ? "Near limit" : "Within limit"}
              </span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${isCapped ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min((result.count / 100) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-neutral-400">
              Sends from support@muffinplants.com via Resend
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
