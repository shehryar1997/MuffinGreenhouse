"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { BULK_BATCH_SIZE, type BulkUpdateResult } from "@/lib/admin-bulk"
import { Alert, buttonClass } from "../_components/ui"
import { useBulk } from "../_components/bulk-select"

// "Publish selected" / "Unpublish selected" for the products list bulk bar. Shares the bar's busy
// lock with "Delete selected" (via setBusy) so the two can't run at once. No confirmation dialog --
// unlike delete this is reversible, so either button just runs on click.
export function BulkPublishButtons({
  action,
}: {
  action: (ids: string[], published: boolean) => Promise<BulkUpdateResult>
}) {
  const { selected, busy, setBusy } = useBulk()
  const [running, setRunning] = useState<"publish" | "unpublish" | null>(null)
  const [outcome, setOutcome] = useState<{ verb: string; result: BulkUpdateResult } | null>(null)

  async function run(published: boolean) {
    if (busy) return
    const ids = [...selected]
    setOutcome(null)
    setRunning(published ? "publish" : "unpublish")
    setBusy(true)
    const total: BulkUpdateResult = { updated: 0, failures: [] }
    try {
      for (let i = 0; i < ids.length; i += BULK_BATCH_SIZE) {
        const batch = ids.slice(i, i + BULK_BATCH_SIZE)
        const result = await action(batch, published)
        total.updated += result.updated
        total.failures.push(...result.failures)
        if (result.error) {
          total.error = result.error
          break
        }
      }
    } catch {
      total.error = "Something went wrong. Some may have been updated: refresh the page to check."
    }
    setBusy(false)
    setRunning(null)
    setOutcome({ verb: published ? "Published" : "Unpublished", result: total })
  }

  return (
    <>
      <button type="button" className={buttonClass({ variant: "secondary", size: "sm" })} onClick={() => run(true)} disabled={busy}>
        <Eye className="h-3.5 w-3.5" aria-hidden />
        {running === "publish" ? "Publishing…" : "Publish selected"}
      </button>
      <button type="button" className={buttonClass({ variant: "secondary", size: "sm" })} onClick={() => run(false)} disabled={busy}>
        <EyeOff className="h-3.5 w-3.5" aria-hidden />
        {running === "unpublish" ? "Unpublishing…" : "Unpublish selected"}
      </button>
      {outcome && (
        <div className="flex w-full items-start gap-2">
          <Alert tone={outcomeTone(outcome.result)} title={outcomeTitle(outcome)} className="flex-1">
            {outcome.result.failures.length > 0 && (
              <ul className="list-disc space-y-0.5 pl-4">
                {outcome.result.failures.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
            {outcome.result.error && outcome.result.updated === 0 && outcome.result.failures.length === 0 && outcome.result.error}
          </Alert>
          <button type="button" className={buttonClass({ variant: "ghost", size: "sm" })} onClick={() => setOutcome(null)}>
            Dismiss
          </button>
        </div>
      )}
    </>
  )
}

function outcomeTone(r: BulkUpdateResult): "success" | "warning" | "danger" {
  if (r.updated === 0) return "danger"
  if (r.failures.length > 0 || r.error) return "warning"
  return "success"
}

function outcomeTitle(outcome: { verb: string; result: BulkUpdateResult }) {
  const { verb, result } = outcome
  const n = (count: number) => `${count} product${count === 1 ? "" : "s"}`
  if (result.updated === 0) return result.error ?? `Couldn't ${verb.toLowerCase()} them`
  if (result.failures.length === 0 && !result.error) return `${verb} ${n(result.updated)}`
  return `${verb} ${n(result.updated)}, but some couldn't be updated`
}
