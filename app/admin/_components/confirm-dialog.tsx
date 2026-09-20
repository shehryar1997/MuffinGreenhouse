"use client"

import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { Loader2 } from "lucide-react"
import { buttonClass } from "./ui"

// A proper confirmation dialog in place of window.confirm(). Controlled: the caller owns `open`, and `onConfirm`
// decides when to close it (so a failed delete can keep the dialog up and show its error).
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  pending = false,
  error,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: "default" | "danger"
  pending?: boolean
  error?: string | null
  onConfirm: () => void
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialog.Portal>
        {/* admin-scope: the dialog is portalled to <body>, outside the admin theme, so it brings the tokens with it. */}
        <AlertDialog.Overlay className="admin-scope fixed inset-0 z-50 bg-ink/50 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="admin-scope fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 text-foreground shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <AlertDialog.Title className="font-sans text-base font-semibold tracking-normal">{title}</AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="mt-2 space-y-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{description}</div>
          </AlertDialog.Description>
          {error && (
            <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel className={buttonClass({ variant: "secondary" })} disabled={pending}>
              {cancelLabel}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              className={buttonClass({ variant: tone === "danger" ? "danger-solid" : "primary" })}
              disabled={pending}
              onClick={(e) => {
                // Keep the dialog open until the caller says otherwise.
                e.preventDefault()
                onConfirm()
              }}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
