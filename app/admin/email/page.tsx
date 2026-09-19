import { Suspense } from "react"
import { countEmailsSentThisMonth } from "@/lib/email/monthly-count"
import { EmailForm } from "./email-form"

// The count comes live from Resend on every load.
export const dynamic = "force-dynamic"

async function MonthlyEmailSummary() {
  const result = await countEmailsSentThisMonth()

  return (
    <div className="rounded-lg border bg-white p-4 max-w-xl">
      <p className="text-xs uppercase tracking-wide text-neutral-500">
        E-mails sent via Resend{result.ok ? ` in ${result.monthLabel}` : " this month"}
      </p>
      {result.ok ? (
        <>
          <p className="text-2xl font-semibold mt-1">
            {result.count.toLocaleString("en-PK")}
            {result.capped ? "+" : ""}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            Counted from the 1st of the month (Pakistan time). Includes order e-mails, verification codes and replies sent from this page.
          </p>
        </>
      ) : (
        <p role="alert" className="mt-1 text-sm text-amber-700">
          {result.error}
        </p>
      )}
    </div>
  )
}

export default function AdminEmailPage() {
  return (
    <div>
      <h1 className="text-2xl font-serif mb-6">Send Email</h1>
      <div className="mb-6">
        <Suspense
          fallback={
            <div className="rounded-lg border bg-white p-4 max-w-xl text-sm text-neutral-500">Counting this month&apos;s e-mails…</div>
          }
        >
          <MonthlyEmailSummary />
        </Suspense>
      </div>
      <EmailForm />
    </div>
  )
}
