"use client"

import { useActionState, useMemo, useState } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { pakistanCities } from "@/data/pakistan-cities"
import { rs } from "../../_components/format"
import { Alert, CheckField, Field, FormActions, FormSection, buttonClass, inputClass, textareaClass } from "../../_components/ui"
import type { CreateManualOrderState } from "./actions"

export interface CatalogOption {
  key: string
  productId: string
  variantId: string | null
  label: string
  sku: string
  price: number
  stock: number
}

interface Line {
  id: number
  key: string
  quantity: number
}

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "Easypaisa" },
  { value: "nayapay", label: "NayaPay" },
  { value: "zindigi", label: "Zindigi" },
  { value: "raast", label: "Raast" },
  { value: "card", label: "Card" },
]

const CITIES = [...pakistanCities].map((c) => c.name).sort((a, b) => a.localeCompare(b))

function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" })
}

export function OrderForm({
  options,
  action,
}: {
  options: CatalogOption[]
  action: (prev: CreateManualOrderState, formData: FormData) => Promise<CreateManualOrderState>
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [lines, setLines] = useState<Line[]>([{ id: 1, key: "", quantity: 1 }])
  const [nextId, setNextId] = useState(2)
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery")
  const [deliveryFee, setDeliveryFee] = useState("")
  const [discount, setDiscount] = useState("")

  const byKey = useMemo(() => new Map(options.map((o) => [o.key, o])), [options])

  const chosen = lines.map((l) => ({ line: l, option: byKey.get(l.key) }))
  const subtotal = chosen.reduce((sum, { line, option }) => sum + (option ? option.price * line.quantity : 0), 0)
  const fee = deliveryType === "delivery" && deliveryFee.trim() !== "" ? Number(deliveryFee) || 0 : 0
  const off = Number(discount) || 0
  const total = subtotal + fee - off

  const updateLine = (id: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const addLine = () => {
    setLines((ls) => [...ls, { id: nextId, key: "", quantity: 1 }])
    setNextId((n) => n + 1)
  }
  const removeLine = (id: number) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.id !== id) : ls))

  const itemsJson = JSON.stringify(
    chosen.filter((c) => c.option).map(({ line, option }) => ({ productId: option!.productId, variantId: option!.variantId, quantity: line.quantity }))
  )

  return (
    <form action={formAction}>
      <input type="hidden" name="items" value={itemsJson} />

      <FormSection title="Customer" description="Who ordered. The WhatsApp number is how repeat customers are matched.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <input name="name" required maxLength={120} autoComplete="off" className={inputClass} />
          </Field>
          <Field label="WhatsApp number" required>
            <input name="phone" type="tel" required autoComplete="off" placeholder="0300 1234567" className={inputClass} />
          </Field>
        </div>
        <Field label="Email (optional)" hint="Only if they gave you one. Leave blank otherwise: nothing is e-mailed for these orders either way.">
          <input name="email" type="email" autoComplete="off" className={inputClass} />
        </Field>
      </FormSection>

      <FormSection title="Items" description="Prices come from your catalogue, and stock is reduced when you save.">
        <div className="space-y-3">
          {chosen.map(({ line, option }, i) => (
            <div key={line.id} className="grid grid-cols-[minmax(0,1fr)_5rem_auto] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_5.5rem_7rem_auto]">
              <Field label={i === 0 ? "Product" : <span className="sr-only">Product</span>} className="col-span-3 sm:col-span-1">
                <select value={line.key} onChange={(e) => updateLine(line.id, { key: e.target.value })} className={inputClass} required>
                  <option value="">Choose a product…</option>
                  {options.map((o) => (
                    <option key={o.key} value={o.key} disabled={o.stock <= 0}>
                      {o.label} · {rs(o.price)} · {o.stock > 0 ? `${o.stock} in stock` : "out of stock"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={i === 0 ? "Qty" : <span className="sr-only">Quantity</span>}>
                <input
                  type="number"
                  min={1}
                  max={option ? Math.max(1, Math.min(99, option.stock)) : 99}
                  value={line.quantity}
                  onChange={(e) => updateLine(line.id, { quantity: Math.max(1, Math.floor(Number(e.target.value)) || 1) })}
                  className={inputClass}
                />
              </Field>
              <p className="hidden pb-2 text-right text-sm font-medium tabular-nums sm:block">{option ? rs(option.price * line.quantity) : "—"}</p>
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                disabled={lines.length === 1}
                aria-label="Remove this item"
                className={buttonClass({ variant: "ghost", size: "sm", className: "mb-0.5" })}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addLine} className={buttonClass({ size: "sm" })}>
          <Plus className="h-4 w-4" aria-hidden />
          Add another item
        </button>
      </FormSection>

      <FormSection title="Delivery" description="How the customer gets it.">
        <div className="flex flex-wrap gap-6">
          {(["delivery", "pickup"] as const).map((type) => (
            <label key={type} className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="radio"
                name="delivery_type"
                value={type}
                checked={deliveryType === type}
                onChange={() => setDeliveryType(type)}
                className="h-4 w-4 accent-forest-700"
              />
              {type === "delivery" ? "Delivery" : "Pickup"}
            </label>
          ))}
        </div>
        {deliveryType === "delivery" && (
          <>
            <Field label="Delivery address" required>
              <textarea name="street" required minLength={5} maxLength={500} rows={2} className={textareaClass} placeholder="House / flat, street, area" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" required>
                <select name="city" required defaultValue="Karachi" className={inputClass}>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Delivery fee (PKR)" hint="Leave blank for the standard rate. Enter 0 for free delivery.">
                <input name="delivery_fee" type="number" min={0} step="1" inputMode="numeric" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className={inputClass} />
              </Field>
            </div>
          </>
        )}
      </FormSection>

      <FormSection title="Payment" description="Record how they pay, and whether the money has arrived.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Payment method">
            <select name="payment_method" defaultValue="bank_transfer" className={inputClass}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Discount (PKR)" hint="For a price you agreed below the catalogue.">
            <input name="discount" type="number" min={0} step="1" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <CheckField name="paid" label="Payment already received" description="Leave unticked to mark it unpaid; you can press “Mark paid” on the order later." />
      </FormSection>

      <FormSection title="Details" description="Optional.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Order date" hint="Leave as is for today, or pick the day they actually ordered.">
            <input name="order_date" type="date" max={todayISO()} defaultValue={todayISO()} className={inputClass} />
          </Field>
        </div>
        <Field label="Internal note">
          <textarea name="notes" maxLength={1000} rows={3} className={textareaClass} placeholder="Anything worth remembering about this order" />
        </Field>
      </FormSection>

      <FormActions>
        <button type="submit" disabled={pending || itemsJson === "[]"} className={buttonClass({ variant: "primary" })}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {pending ? "Saving…" : "Save order"}
        </button>
        <p className="text-sm tabular-nums text-muted-foreground">
          Items {rs(subtotal)}
          {fee > 0 && ` + delivery ${rs(fee)}`}
          {off > 0 && ` − discount ${rs(off)}`} ={" "}
          <span className="font-semibold text-foreground">{rs(Math.max(0, total))}</span>
          {deliveryType === "delivery" && deliveryFee.trim() === "" && <span> (+ standard delivery)</span>}
        </p>
        {state?.error && (
          <Alert tone="danger" className="w-full">
            {state.error}
          </Alert>
        )}
      </FormActions>
    </form>
  )
}
