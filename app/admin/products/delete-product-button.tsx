"use client"

import { useState, useTransition } from "react"
import type { ProductActionResult } from "./actions"

// Used both on the edit page and beside "Edit" in the products list. The server action
// redirects to the list on success; if it can't delete (e.g. the product is in past
// orders) it returns an error, which is shown right here instead of crashing the page.
export function DeleteProductButton({
  productName,
  action,
  label = "Delete product",
}: {
  productName: string
  action: () => Promise<ProductActionResult>
  label?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    if (isPending) return
    if (!confirm(`Delete "${productName}"? This can't be undone.`)) return
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
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        {isPending ? "Deleting…" : label}
      </button>
      {error && (
        <span role="alert" className="mt-1 max-w-xs text-right text-xs text-red-600">
          {error}
        </span>
      )}
    </span>
  )
}
