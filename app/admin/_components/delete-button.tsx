"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { ConfirmDialog } from "./confirm-dialog"
import { buttonClass } from "./ui"

// One delete button for products, events and journal posts: a confirmation dialog, then the server action.
// On failure the dialog stays open and shows the error; on success the action redirects or revalidates.
export function DeleteButton({
  title,
  description,
  action,
  label = "Delete",
  confirmLabel = "Delete",
  fallbackError,
  size = "sm",
}: {
  title: string
  description: string
  action: () => Promise<{ error?: string } | void>
  label?: string
  confirmLabel?: string
  fallbackError: string
  size?: "sm" | "md"
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function confirm() {
    if (isPending) return
    setError(null)
    startTransition(async () => {
      try {
        const result = await action()
        if (result?.error) setError(result.error)
      } catch {
        setError(fallbackError)
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
        className={buttonClass({ variant: "danger", size })}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        {label}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        tone="danger"
        pending={isPending}
        error={error}
        onConfirm={confirm}
      />
    </>
  )
}
