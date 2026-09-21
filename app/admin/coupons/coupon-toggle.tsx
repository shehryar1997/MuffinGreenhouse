"use client"

import { useState, useTransition } from "react"
import { cn } from "@/lib/utils"
import type { CouponActionResult } from "./actions"

// Active/inactive switch: flips immediately, rolls back and shows the error if the server refuses.
export function CouponToggle({ code, active, action }: { code: string; active: boolean; action: (active: boolean) => Promise<CouponActionResult> }) {
  const [checked, setChecked] = useState(active)
  const [syncedFrom, setSyncedFrom] = useState(active)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (active !== syncedFrom) {
    setSyncedFrom(active)
    setChecked(active)
  }

  function toggle() {
    if (isPending) return
    const next = !checked
    setChecked(next)
    setError(null)
    startTransition(async () => {
      try {
        const result = await action(next)
        if (result?.error) {
          setChecked(!next)
          setError(result.error)
        }
      } catch {
        setChecked(!next)
        setError("Couldn't update the coupon. Check your connection and try again.")
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={`${checked ? "Deactivate" : "Activate"} ${code}`}
          onClick={toggle}
          disabled={isPending}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60",
            checked ? "bg-primary" : "bg-muted-foreground/30"
          )}
        >
          <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
        </button>
        <span className={cn("text-[13px]", checked ? "font-medium text-foreground" : "text-muted-foreground")}>{checked ? "Active" : "Inactive"}</span>
      </div>
      {error && (
        <p role="alert" className="max-w-[16rem] text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
