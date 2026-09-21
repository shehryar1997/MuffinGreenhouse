"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { Trash2, X } from "lucide-react"
import { BULK_BATCH_SIZE, type BulkDeleteResult } from "@/lib/admin-bulk"
import { Alert, buttonClass } from "./ui"
import { ConfirmDialog } from "./confirm-dialog"

// Select-several-and-delete for admin lists. The page (a server component) wraps its list in <BulkSelect>,
// puts <SelectAllCheck /> in the table header and a <RowCheck /> in each row; the bar with "Delete selected"
// appears by itself once something is ticked. Deletion goes through a server action in small batches.

interface Ctx {
  selected: Set<string>
  toggle: (id: string) => void
  setAll: (on: boolean) => void
  total: number
  busy: boolean
}

const BulkContext = createContext<Ctx | null>(null)

function useBulk() {
  const ctx = useContext(BulkContext)
  if (!ctx) throw new Error("RowCheck / SelectAllCheck must be used inside <BulkSelect>")
  return ctx
}

const checkboxClass = "h-4 w-4 cursor-pointer rounded border-input accent-forest-700 disabled:cursor-not-allowed"

/** The checkbox in the table header (or above a list): selects or clears every row on the page. */
export function SelectAllCheck({ label = "Select all" }: { label?: string }) {
  const { selected, setAll, total, busy } = useBulk()
  const ref = useRef<HTMLInputElement>(null)
  const all = total > 0 && selected.size === total
  const some = selected.size > 0 && !all

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = some
  }, [some])

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      className={checkboxClass}
      checked={all}
      disabled={busy || total === 0}
      onChange={(e) => setAll(e.target.checked)}
    />
  )
}

/** The checkbox in one row. `label` names the row for screen readers (e.g. the product name). */
export function RowCheck({ id, label }: { id: string; label: string }) {
  const { selected, toggle, busy } = useBulk()
  return (
    <input
      type="checkbox"
      aria-label={`Select ${label}`}
      data-row-check
      className={checkboxClass}
      checked={selected.has(id)}
      disabled={busy}
      onChange={() => toggle(id)}
    />
  )
}

export function BulkSelect({
  ids,
  noun,
  nounPlural = `${noun}s`,
  description,
  action,
  flaggedIds = [],
  flaggedNotice,
  children,
}: {
  /** Every id currently listed on the page. Selecting "all" means these. */
  ids: string[]
  noun: string
  nounPlural?: string
  /** Shown in the confirmation dialog. */
  description: string
  action: (ids: string[]) => Promise<BulkDeleteResult>
  /** Rows that need an extra warning (e.g. customers who have orders). `{n}` in the notice becomes their count. */
  flaggedIds?: string[]
  flaggedNotice?: string
  children: React.ReactNode
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const [progress, setProgress] = useState<{ done: number; of: number } | null>(null)
  const [outcome, setOutcome] = useState<BulkDeleteResult | null>(null)

  // Rows that left the page (deleted, filtered out, next page) can't stay selected.
  const selected = useMemo(() => {
    const onPage = new Set(ids)
    return new Set([...picked].filter((id) => onPage.has(id)))
  }, [picked, ids])

  const busy = progress !== null
  const count = selected.size
  const flaggedCount = flaggedIds.filter((id) => selected.has(id)).length
  const what = count === 1 ? noun : nounPlural

  const ctx: Ctx = {
    selected,
    total: ids.length,
    busy,
    toggle: (id) => {
      setOutcome(null)
      setPicked((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    },
    setAll: (on) => {
      setOutcome(null)
      setPicked(on ? new Set(ids) : new Set())
    },
  }

  async function run() {
    if (busy) return
    const toDelete = [...selected]
    const total: BulkDeleteResult = { deleted: 0, failures: [] }
    setProgress({ done: 0, of: toDelete.length })
    try {
      for (let i = 0; i < toDelete.length; i += BULK_BATCH_SIZE) {
        const batch = toDelete.slice(i, i + BULK_BATCH_SIZE)
        const result = await action(batch)
        total.deleted += result.deleted
        total.failures.push(...result.failures)
        if (result.error) {
          total.error = result.error
          break
        }
        setProgress({ done: Math.min(i + batch.length, toDelete.length), of: toDelete.length })
      }
    } catch {
      total.error = "Something went wrong while deleting. Some may have been deleted: refresh the page to check."
    }
    setProgress(null)
    setConfirming(false)
    setPicked(new Set())
    setOutcome(total)
  }

  const summary = outcome && describeOutcome(outcome, noun, nounPlural)

  return (
    <BulkContext.Provider value={ctx}>
      {(count > 0 || summary) && (
        <div className="sticky top-[4.25rem] z-20 mb-3 space-y-2 lg:top-3">
          {count > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-border bg-surface px-4 py-2.5 shadow-sm">
              <p className="text-sm font-medium tabular-nums text-foreground" aria-live="polite">
                {count} {what} selected
              </p>
              <div className="flex items-center gap-2">
                <button type="button" className={buttonClass({ variant: "ghost", size: "sm" })} onClick={() => ctx.setAll(false)} disabled={busy}>
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Clear
                </button>
                <button type="button" className={buttonClass({ variant: "danger", size: "sm" })} onClick={() => setConfirming(true)} disabled={busy}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Delete selected
                </button>
              </div>
            </div>
          )}
          {summary && (
            <div className="flex items-start gap-2">
              <Alert tone={summary.tone} title={summary.title} className="flex-1">
                {summary.detail}
              </Alert>
              <button type="button" className={buttonClass({ variant: "ghost", size: "sm" })} onClick={() => setOutcome(null)}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {children}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${count} ${what}?`}
        description={[
          flaggedCount > 0 && flaggedNotice ? flaggedNotice.replace("{n}", String(flaggedCount)) : null,
          description,
        ]
          .filter(Boolean)
          .join("\n\n")}
        confirmLabel={progress ? `Deleting… ${progress.done} of ${progress.of}` : `Delete ${count} ${what}`}
        tone="danger"
        pending={busy}
        onConfirm={run}
      />
    </BulkContext.Provider>
  )
}

function describeOutcome(r: BulkDeleteResult, noun: string, nounPlural: string) {
  const n = (count: number) => `${count} ${count === 1 ? noun : nounPlural}`
  const kept = r.failures.length
  if (r.error && r.deleted === 0 && kept === 0) {
    return { tone: "danger" as const, title: "Nothing was deleted", detail: r.error }
  }
  const lines = [...r.failures, ...(r.error ? [r.error] : [])]
  if (lines.length === 0) return { tone: "success" as const, title: `Deleted ${n(r.deleted)}`, detail: null }
  return {
    tone: r.deleted > 0 ? ("warning" as const) : ("danger" as const),
    title: r.deleted > 0 ? `Deleted ${n(r.deleted)}, but some couldn't be deleted` : `Couldn't delete ${kept === 1 ? "it" : "them"}`,
    detail: (
      <ul className="list-disc space-y-0.5 pl-4">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    ),
  }
}
