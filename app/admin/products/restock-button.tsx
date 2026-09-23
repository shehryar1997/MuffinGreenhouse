"use client"

import { useState, useTransition } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Loader2, PackagePlus, X } from "lucide-react"
import { buttonClass, inputClass } from "../_components/ui"
import { restockProduct } from "./actions"

export type RestockSize = { id: string; name: string; stock: number; price: number; compareAt: number | null }

// Change stock, prices and was prices of a product's sizes straight from the list: the everyday job after a delivery arrives,
// without opening (and re-saving) the whole product form. Every change lands in the stock history with the note.
export function RestockButton({ productId, productName, sizes }: { productId: string; productName: string; sizes: RestockSize[] }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState(sizes)
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()

  const reset = (next: boolean) => {
    if (saving) return
    if (next) {
      setRows(sizes)
      setNote("")
      setError(null)
    }
    setOpen(next)
  }
  const update = (id: string, patch: Partial<RestockSize>) => setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const save = () => {
    setError(null)
    if (rows.some((r) => !Number.isInteger(r.stock) || r.stock < 0)) return setError("Stock must be a whole number, 0 or more.")
    if (rows.some((r) => !(r.price > 0))) return setError("Every size needs a price greater than 0.")
    if (rows.some((r) => r.compareAt !== null && (Number.isNaN(r.compareAt) || r.compareAt < 0))) return setError("Was price must be a number, 0 or more, or left empty.")
    const badWas = rows.find((r) => r.compareAt !== null && r.compareAt > 0 && r.compareAt <= r.price)
    if (badWas) return setError(`“${badWas.name}”: the was price must be higher than its price, or left empty.`)
    startSaving(async () => {
      try {
        const result = await restockProduct(productId, rows.map((r) => ({ variantId: r.id, stock: r.stock, price: r.price, compareAt: r.compareAt || null })), note)
        if (result?.error) setError(result.error)
        else setOpen(false)
      } catch {
        setError("Couldn't save. Check your connection and try again.")
      }
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={reset}>
      <Dialog.Trigger className={buttonClass({ size: "sm" })}>
        <PackagePlus className="h-4 w-4" aria-hidden />
        Stock
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="admin-scope fixed inset-0 z-50 bg-ink/50" />
        <Dialog.Content className="admin-scope fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-surface p-6 text-foreground shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-semibold">Stock and prices</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">{productName}</Dialog.Description>
            </div>
            <Dialog.Close className={buttonClass({ variant: "ghost", size: "sm" })} aria-label="Close" disabled={saving}>
              <X className="h-4 w-4" aria-hidden />
            </Dialog.Close>
          </div>

          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th scope="col" className="pb-2 font-medium">Size</th>
                <th scope="col" className="w-24 pb-2 font-medium">In stock</th>
                <th scope="col" className="w-28 pb-2 font-medium">Price (PKR)</th>
                <th scope="col" className="w-28 pb-2 pl-2 font-medium">Was price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const original = sizes.find((s) => s.id === r.id)
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2 pr-3">
                      <span className="font-medium">{r.name}</span>
                      {original && original.stock !== r.stock && (
                        <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                          {r.stock > original.stock ? `+${r.stock - original.stock}` : r.stock - original.stock}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        aria-label={`${r.name} stock`}
                        value={Number.isNaN(r.stock) ? "" : r.stock}
                        onChange={(e) => update(r.id, { stock: e.target.value === "" ? NaN : Math.floor(Number(e.target.value)) })}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        min={1}
                        inputMode="decimal"
                        aria-label={`${r.name} price`}
                        value={Number.isNaN(r.price) ? "" : r.price}
                        onChange={(e) => update(r.id, { price: e.target.value === "" ? NaN : Number(e.target.value) })}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={0}
                        inputMode="decimal"
                        aria-label={`${r.name} was price`}
                        placeholder="None"
                        value={r.compareAt === null || Number.isNaN(r.compareAt) ? "" : r.compareAt}
                        onChange={(e) => update(r.id, { compareAt: e.target.value === "" ? null : Number(e.target.value) })}
                        className={inputClass}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <label className="mt-4 block text-[13px] font-medium" htmlFor={`restock-note-${productId}`}>
            Note <span className="font-normal text-muted-foreground">(optional, saved in the stock history)</span>
          </label>
          <input
            id={`restock-note-${productId}`}
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Shipment from Thailand, 2 damaged in transit"
            className={`${inputClass} mt-1`}
          />

          {error && (
            <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close className={buttonClass({ variant: "secondary" })} disabled={saving}>
              Cancel
            </Dialog.Close>
            <button type="button" onClick={save} disabled={saving} className={buttonClass({ variant: "primary" })}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
