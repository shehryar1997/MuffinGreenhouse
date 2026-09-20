"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Loader2 } from "lucide-react"
import { buttonClass, inputClass } from "../../_components/ui"
import { markShipped } from "./actions"

export function MarkShippedDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!trackingNumber.trim()) {
      setError("Enter a tracking number")
      return
    }
    setIsSubmitting(true)
    // On success this redirects (via a thrown Next.js signal, not a normal
    // return) so nothing after that point runs - only handle the failure case.
    const result = await markShipped(orderId, trackingNumber.trim())
    setIsSubmitting(false)
    if (!result.success) {
      setError(result.error || "Failed to mark order as shipped")
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={buttonClass()}>
          Mark as shipped
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="admin-scope fixed inset-0 z-50 bg-ink/50 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="admin-scope fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 text-foreground shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="font-sans text-base font-semibold tracking-normal">Mark as shipped</Dialog.Title>
          <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">
            Enter the Leopards Courier tracking number. The customer will be emailed this number automatically.
          </Dialog.Description>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="tracking-number" className="mb-1.5 block text-[13px] font-medium">
                Tracking number
              </label>
              <input
                id="tracking-number"
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. LC123456789"
                autoFocus
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "tracking-error" : undefined}
                className={`${inputClass} font-mono`}
              />
              {error && (
                <p id="tracking-error" role="alert" className="mt-1.5 text-[13px] text-red-700">
                  {error}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Dialog.Close asChild>
                <button type="button" className={buttonClass({ variant: "secondary" })} disabled={isSubmitting}>
                  Cancel
                </button>
              </Dialog.Close>
              <button type="submit" disabled={isSubmitting} className={buttonClass({ variant: "primary" })}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {isSubmitting ? "Marking as shipped…" : "Confirm and send email"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
