import { Truck } from "lucide-react"
import { FREE_DELIVERY_MAX_ITEMS, FREE_DELIVERY_THRESHOLD, qualifiesForFreeDelivery } from "@/lib/delivery-fee"
import { formatPrice } from "@/lib/utils"

// Progress toward free delivery. Only orders with fewer than 4 items qualify, so a big order gets a plain note instead of a bar.
export function FreeDeliveryBar({ subtotal, itemCount, className = "" }: { subtotal: number; itemCount: number; className?: string }) {
  const tooManyItems = itemCount > FREE_DELIVERY_MAX_ITEMS
  const unlocked = qualifiesForFreeDelivery(subtotal, itemCount)
  const pct = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100))
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal)

  return (
    <div className={`rounded-lg border border-forest-200 bg-forest-50 p-3 ${className}`}>
      <p className="flex items-center gap-2 text-sm font-medium text-forest-900">
        <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
        {unlocked
          ? "You've unlocked free delivery!"
          : tooManyItems
            ? `Free delivery on orders of ${formatPrice(FREE_DELIVERY_THRESHOLD)}+`
            : `Add ${formatPrice(remaining)} more for free delivery`}
      </p>
      {!tooManyItems && (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-forest-200"
          role="progressbar"
          aria-label="Progress to free delivery"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-sprout-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="mt-1.5 text-xs text-forest-600">Free delivery is only for orders with fewer than {FREE_DELIVERY_MAX_ITEMS + 1} items.</p>
    </div>
  )
}
