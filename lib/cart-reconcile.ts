// Brings a stored cart up to date with the shop: current prices and stock, sizes that were retired, products that
// were unpublished. Pure (no React, no fetch) so the rules can be tested on their own.
import type { CartItem, Product } from "@/types"
import { formatPrice } from "@/lib/utils"

export type CartChange =
  | { kind: "removed"; name: string; reason: "unavailable" | "sold_out" | "size_gone" | "choose_size" }
  | { kind: "price"; name: string; from: number; to: number }
  | { kind: "quantity"; name: string; from: number; to: number }

const unitPrice = (item: CartItem) => item.variant?.price ?? item.product.price
const label = (item: CartItem) => (item.variant && item.variant.name.toLowerCase() !== "standard" ? `${item.product.name} (${item.variant.name})` : item.product.name)

export function reconcileCart(items: CartItem[], fresh: Product[]): { items: CartItem[]; changes: CartChange[] } {
  const byId = new Map(fresh.map((p) => [p.id, p]))
  const next: CartItem[] = []
  const changes: CartChange[] = []

  for (const item of items) {
    const product = byId.get(item.product.id)
    if (!product) {
      changes.push({ kind: "removed", name: label(item), reason: "unavailable" })
      continue
    }

    let variant = item.variant ? product.variants.find((v) => v.id === item.variant!.id) : undefined
    if (item.variant && !variant) {
      changes.push({ kind: "removed", name: label(item), reason: "size_gone" })
      continue
    }
    if (!item.variant && product.variants.length > 0) {
      // An old cart line without a size: keep it only when there is exactly one size to give it.
      if (product.variants.length === 1) variant = product.variants[0]
      else {
        changes.push({ kind: "removed", name: product.name, reason: "choose_size" })
        continue
      }
    }

    const updated: CartItem = { product, variant, quantity: item.quantity }
    const stock = variant ? variant.stockCount : product.stockCount
    const status = variant ? variant.stockStatus : product.stockStatus
    if (status === "out_of_stock" || stock <= 0) {
      changes.push({ kind: "removed", name: label(updated), reason: "sold_out" })
      continue
    }
    if (item.quantity > stock) {
      changes.push({ kind: "quantity", name: label(updated), from: item.quantity, to: stock })
      updated.quantity = stock
    }
    if (unitPrice(item) !== unitPrice(updated)) {
      changes.push({ kind: "price", name: label(updated), from: unitPrice(item), to: unitPrice(updated) })
    }
    next.push(updated)
  }
  return { items: next, changes }
}

/** One human sentence per change, for a toast. */
export function describeCartChange(change: CartChange): string {
  switch (change.kind) {
    case "removed":
      return {
        unavailable: `${change.name} is no longer available and was removed from your cart.`,
        sold_out: `${change.name} just sold out and was removed from your cart.`,
        size_gone: `The size of ${change.name} in your cart is no longer sold, so it was removed.`,
        choose_size: `${change.name} now comes in several sizes. Please add it again with the size you want.`,
      }[change.reason]
    case "price":
      return `${change.name} is now ${formatPrice(change.to)} (was ${formatPrice(change.from)}).`
    case "quantity":
      return `Only ${change.to} of ${change.name} left, so your cart now has ${change.to}.`
  }
}
