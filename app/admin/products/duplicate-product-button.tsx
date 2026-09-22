"use client"

import { useState, useTransition } from "react"
import { Copy, Loader2 } from "lucide-react"
import { buttonClass } from "../_components/ui"
import { duplicateProduct } from "./actions"

// Starts a new draft from this product (same details, no photos, no stock) and opens it for editing.
export function DuplicateProductButton({ productId, productName }: { productId: string; productName: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null)
            try {
              const result = await duplicateProduct(productId)
              if (result?.error) setError(result.error)
            } catch (err) {
              // redirect() after a successful copy surfaces here as a navigation, not an error.
              if (!(err instanceof Error && err.message.includes("NEXT_REDIRECT"))) setError("Couldn't copy the product. Try again.")
            }
          })
        }
        aria-label={`Duplicate ${productName}`}
        title="Duplicate as a new draft"
        className={buttonClass({ size: "sm" })}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        <span className="sr-only sm:not-sr-only">Copy</span>
      </button>
      {error && <span role="alert" className="mt-1 max-w-[12rem] text-right text-xs text-red-700">{error}</span>}
    </span>
  )
}
