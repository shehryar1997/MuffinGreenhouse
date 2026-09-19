"use client"

import { useActionState, useRef } from "react"
import { addAttendee, type AddAttendeeState } from "./actions"

const inputClass = "w-full border rounded px-3 py-2 text-sm bg-white"

export function AddAttendeeForm({ eventId, price, spotsLeft }: { eventId: string; price: number; spotsLeft: number }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState<AddAttendeeState, FormData>(async (prev, formData) => {
    const result = await addAttendee(eventId, prev, formData)
    if (result?.added) formRef.current?.reset()
    return result
  }, undefined)

  if (spotsLeft <= 0) {
    return <p className="text-sm text-neutral-600">This event is full. Raise the total spots (Edit event) or cancel a booking to add someone.</p>
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <label className="block">
        <span className="block text-sm font-medium text-neutral-700 mb-1">Name</span>
        <input name="guest_name" required className={inputClass} autoComplete="off" />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-neutral-700 mb-1">WhatsApp number</span>
        <input name="guest_phone" type="tel" required className={inputClass} placeholder="0300 1234567" autoComplete="off" />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-neutral-700 mb-1">E-mail (optional)</span>
        <input name="guest_email" type="email" className={inputClass} autoComplete="off" />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-neutral-700 mb-1">People</span>
        <input name="spots" type="number" min={1} max={Math.min(20, spotsLeft)} defaultValue={1} className={inputClass} />
      </label>
      {price > 0 && (
        <div className="rounded-lg bg-neutral-50 border p-3 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="already_paid" />
            Already paid
          </label>
          <select name="payment_method" defaultValue="cash" className={inputClass}>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="jazzcash">JazzCash</option>
            <option value="easypaisa">Easypaisa</option>
            <option value="other">Other</option>
          </select>
          <p className="text-xs text-neutral-500">If unpaid, the spot is held for 24 hours like an online booking.</p>
        </div>
      )}
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.added && (
        <p role="status" className="text-sm text-emerald-700">
          {state.added}
        </p>
      )}
      <button type="submit" disabled={pending} className="w-full bg-neutral-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50">
        {pending ? "Adding…" : "Add attendee"}
      </button>
    </form>
  )
}
