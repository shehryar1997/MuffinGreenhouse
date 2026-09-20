"use client"

import { useActionState, useRef } from "react"
import { Loader2 } from "lucide-react"
import { Alert, CheckField, Field, buttonClass, inputClass } from "../_components/ui"
import { addAttendee, type AddAttendeeState } from "./actions"

export function AddAttendeeForm({ eventId, price, spotsLeft }: { eventId: string; price: number; spotsLeft: number }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState<AddAttendeeState, FormData>(async (prev, formData) => {
    const result = await addAttendee(eventId, prev, formData)
    if (result?.added) formRef.current?.reset()
    return result
  }, undefined)

  if (spotsLeft <= 0) {
    return <p className="text-sm text-muted-foreground">This event is full. Raise the total spots (Edit event) or cancel a booking to add someone.</p>
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <Field label="Name" required>
        <input name="guest_name" required className={inputClass} autoComplete="off" />
      </Field>
      <Field label="WhatsApp number" required>
        <input name="guest_phone" type="tel" required className={inputClass} placeholder="0300 1234567" autoComplete="off" />
      </Field>
      <Field label="Email (optional)">
        <input name="guest_email" type="email" className={inputClass} autoComplete="off" />
      </Field>
      <Field label="People">
        <input name="spots" type="number" min={1} max={Math.min(20, spotsLeft)} defaultValue={1} className={inputClass} />
      </Field>
      {price > 0 && (
        <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
          <CheckField name="already_paid" label="Already paid" />
          <select name="payment_method" aria-label="Payment method" defaultValue="cash" className={inputClass}>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="jazzcash">JazzCash</option>
            <option value="easypaisa">Easypaisa</option>
            <option value="other">Other</option>
          </select>
          <p className="text-xs text-muted-foreground">If unpaid, the spot is held for 24 hours like an online booking.</p>
        </div>
      )}
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {state?.added && <Alert tone="success">{state.added}</Alert>}
      <button type="submit" disabled={pending} className={buttonClass({ variant: "primary", className: "w-full" })}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {pending ? "Adding…" : "Add attendee"}
      </button>
    </form>
  )
}
