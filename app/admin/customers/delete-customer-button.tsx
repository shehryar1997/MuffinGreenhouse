"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { ConfirmDialog } from "../_components/confirm-dialog"
import { buttonClass } from "../_components/ui"
import type { CustomerActionResult } from "./actions"

// Two questions, as before: delete the profile? then, if they have orders, delete those too? Each is a dialog now.
type Step = "profile" | "orders" | null

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
  const [step, setStep] = useState<Step>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(deleteOrders: boolean) {
    if (isPending) return
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

  const orders = `${orderCount} order${orderCount === 1 ? "" : "s"}`

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null)
          setStep("profile")
        }}
        className={buttonClass({ variant: "danger", size: "sm" })}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        {label}
      </button>

      <ConfirmDialog
        open={step === "profile"}
        onOpenChange={(open) => !open && setStep(null)}
        title="Delete this profile?"
        description={`Permanently delete the profile for ${email}?\n\nThis removes their account, login, saved addresses and wishlist. It cannot be undone.`}
        confirmLabel={orderCount > 0 ? "Continue" : "Delete profile"}
        tone="danger"
        pending={isPending}
        error={error}
        onConfirm={() => {
          if (orderCount > 0) setStep("orders")
          else run(false)
        }}
      />

      <ConfirmDialog
        open={step === "orders"}
        onOpenChange={(open) => !open && setStep(null)}
        title={`Also delete ${orders}?`}
        description={`${email} has ${orders}.\n\nTo delete this profile those orders must be deleted too. They will disappear from your order list and revenue totals, and any stock they reserved is NOT returned.`}
        confirmLabel={`Delete profile and ${orders}`}
        tone="danger"
        pending={isPending}
        error={error}
        onConfirm={() => run(true)}
      />
    </>
  )
}
