"use client"

import { useState, useTransition } from "react"
import { Trash2, AlertTriangle } from "lucide-react"
import type { ProductActionResult } from "./actions"

export function DeleteProductButton({
  productName,
  action,
  label = "Delete",
}: {
  productName: string
  action: () => Promise<ProductActionResult>
  label?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    if (isPending) return
    if (!confirm(`Delete "${productName}"?\n\nThis action cannot be undone.`)) return
    setError(null)
    startTransition(async () => {
      try {
        const result = await action()
        if (result?.error) setError(result.error)
      } catch {
        setError("Couldn't delete the product. Check your connection and try again.")
      }
    })
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="h-3.5 w-3.5" />
            {label}
          </>
        )}
      </button>
      {error && (
        <span role="alert" className="mt-1 max-w-xs text-right text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </span>
      )}
    </span>
  )
}
