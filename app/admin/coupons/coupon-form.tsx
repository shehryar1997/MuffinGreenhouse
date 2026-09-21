"use client"

import { useRef, useState } from "react"
import { Alert, CheckField, Field, inputClass } from "../_components/ui"
import { SubmitButton } from "../_components/submit-button"
import type { CouponActionResult } from "./actions"

export function CouponForm({ action }: { action: (formData: FormData) => Promise<CouponActionResult> }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(formData: FormData) {
    setError(null)
    const result = await action(formData)
    if (result?.error) setError(result.error)
    else formRef.current?.reset()
  }

  return (
    <form ref={formRef} action={submit} className="space-y-4">
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Coupon code" required htmlFor="coupon-code" hint="Customers type this at checkout. Not case-sensitive.">
          <input id="coupon-code" name="code" required maxLength={30} placeholder="WELCOME10" autoCapitalize="characters" spellCheck={false} className={inputClass} />
        </Field>
        <Field label="Discount (%)" required htmlFor="coupon-percent" hint="Taken off the items total, not delivery.">
          <input id="coupon-percent" name="discount_percent" type="number" required min={0.01} max={100} step="any" placeholder="10" className={inputClass} />
        </Field>
        <Field label="Discount cap (Rs)" htmlFor="coupon-cap" hint="The most this coupon can take off. Leave empty for no cap.">
          <input id="coupon-cap" name="max_discount" type="number" min={1} step="any" placeholder="1000" className={inputClass} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Usage limit" htmlFor="coupon-uses" hint="Total times it can be used across all customers. Leave empty for unlimited.">
          <input id="coupon-uses" name="max_uses" type="number" min={1} step={1} placeholder="100" className={inputClass} />
        </Field>
        <Field label="Valid until" htmlFor="coupon-expiry" hint="Works through the end of this day (Pakistan time). Leave empty for no expiry.">
          <input id="coupon-expiry" name="expires_on" type="date" className={inputClass} />
        </Field>
      </div>
      <CheckField name="is_active" label="Active" description="Inactive coupons are rejected at checkout." defaultChecked />
      <SubmitButton pendingLabel="Adding…">Add coupon</SubmitButton>
    </form>
  )
}
