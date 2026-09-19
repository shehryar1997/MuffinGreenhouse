"use client"

import { useState, useTransition } from "react"
import type { CustomerActionResult } from "./actions"

export function DeleteCustomerButton({
  email,
  orderCount,
  action,
  label = "Delete profile",
}: {
  email: string
  orderCount: number
  action: (deleteOrders: boolean) => Promise<CustomerActionResult>
  label?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    if (isPending) return
    if (
      !confirm(
        `Permanently delete the profile for ${email}?\n\nThis removes their account, login, saved addresses and wishlist. It can't be undone.`
      )
    ) {
      return
    }
    let deleteOrders = false
    if (orderCount > 0) {
      const alsoOrders = confirm(
        `${email} has ${orderCount} order${orderCount === 1 ? "" : "s"}.\n\nTo delete this profile those orders must be deleted too. They will disappear from your order list and revenue totals, and any stock they reserved is NOT returned.\n\nDelete the profile AND its ${orderCount} order${orderCount === 1 ? "" : "s"}?`
      )
      if (!alsoOrders) return
      deleteOrders = true
    }
    setError(null)
    startTransition(async () => {
      try {
        const result = await action(deleteOrders)
        if (result?.error) setError(result.error)
      } catch {
        setError("Couldn't delete the profile. Check your connection and try again.")
      }
    })
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button type="button" onClick={handleClick} disabled={isPending} className="text-sm text-red-600 hover:underline disabled:opacity-50">
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
