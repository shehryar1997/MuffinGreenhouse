import Link from "next/link"
import { Search } from "lucide-react"
import { buttonClass, inputClass, linkClass } from "../_components/ui"

const PAYMENT_OPTIONS = [
  { value: "", label: "Any payment" },
  { value: "pending", label: "Awaiting payment" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
]

// Search by order number, customer name, e-mail or phone, and filter by payment. A plain GET form, so the filters
// live in the URL (shareable, and the dashboard can link straight to "awaiting payment").
export function OrdersSearchFilters({ q, status, payment }: { q: string; status: string; payment: string }) {
  const active = q || payment
  return (
    <form method="GET" action="/admin/orders" role="search" className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {status && status !== "all" && <input type="hidden" name="status" value={status} />}
      <div className="relative flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={q}
          aria-label="Search orders"
          placeholder="Order number, name, e-mail or phone"
          className={`${inputClass} pl-9`}
        />
      </div>
      <select name="payment" defaultValue={payment} aria-label="Payment" className={`${inputClass} sm:w-48`}>
        {PAYMENT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button type="submit" className={buttonClass({ variant: "secondary" })}>Apply</button>
      {active && (
        <Link href={status && status !== "all" ? `/admin/orders?status=${status}` : "/admin/orders"} className={`${linkClass} text-[13px]`}>
          Clear
        </Link>
      )}
    </form>
  )
}
