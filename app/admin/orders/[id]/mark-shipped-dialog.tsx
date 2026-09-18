"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
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
        <button type="button" className="bg-white border rounded px-4 py-2 text-sm font-medium hover:bg-neutral-50">
          Mark as Shipped
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
          <Dialog.Title className="text-lg font-serif text-neutral-900">Mark as Shipped</Dialog.Title>
          <Dialog.Description className="text-sm text-neutral-500 mt-1">
            Enter the Leopards Courier tracking number. The customer will be emailed this number automatically.
          </Dialog.Description>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="tracking-number" className="block text-sm font-medium text-neutral-700 mb-1">
                Tracking Number
              </label>
              <input
                id="tracking-number"
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. LC123456789"
                autoFocus
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2C]"
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button type="button" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 rounded" disabled={isSubmitting}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#E85D2C] text-white rounded px-4 py-2 text-sm font-medium hover:bg-[#d45124] disabled:opacity-60"
              >
                {isSubmitting ? "Marking as Shipped..." : "Confirm & Send Email"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
