"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import type { JournalActionResult } from "./actions"

export function DeletePostButton({ title, action }: { title: string; action: () => Promise<JournalActionResult> }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    if (isPending) return
    if (!confirm(`Delete "${title}"?\n\nThis can't be undone. To hide it without deleting, untick “Publish” and save instead.`)) return
    setError(null)
    startTransition(async () => {
      try {
        const result = await action()
        if (result?.error) setError(result.error)
      } catch {
        setError("Couldn't delete the post. Check your connection and try again.")
      }
    })
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <span role="alert" className="mt-1 max-w-xs text-right text-xs text-red-600">
          {error}
        </span>
      )}
    </span>
  )
}
