"use client"

import { useState } from "react"
import { Search, ChevronDown } from "lucide-react"
import Link from "next/link"

export function OrdersSearchFilters({ q, status, payment }: { q: string; status: string; payment: string }) {
  const [query, setQuery] = useState(q)
  const [paymentOpen, setPaymentOpen] = useState(false)

  const paymentLabel: Record<string, string> = {
    all: "All Payments",
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
  }

  const buildLink = (params: Record<string, string | undefined>) => {
    const base: Record<string, string> = {}
    if (query) base.q = query
    if (status && status !== "all") base.status = status
    Object.entries(params).forEach(([k, v]) => { if (v) base[k] = v; else delete base[k] })
    const qs = new URLSearchParams(base).toString()
    return `/admin/orders${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <form method="GET" action="/admin/orders" className="flex-1">
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="payment" value={payment} />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, customers..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#E85D2C] focus:border-transparent"
          />
        </div>
      </form>

      {/* Payment filter dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setPaymentOpen(!paymentOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          {paymentLabel[payment] || "All Payments"}
          <ChevronDown className={`h-4 w-4 transition-transform ${paymentOpen ? "rotate-180" : ""}`} />
        </button>
        {paymentOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg border border-neutral-200 shadow-lg z-10">
            {Object.entries(paymentLabel).map(([key, label]) => (
              <Link
                key={key}
                href={buildLink({ payment: key === "all" ? undefined : key })}
                className={`block px-4 py-2 text-sm ${payment === key ? "bg-[#E85D2C]/10 text-[#E85D2C]" : "text-neutral-700 hover:bg-neutral-50"}`}
                onClick={() => setPaymentOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {q && (
        <Link href="/admin/orders" className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900">
          Clear
        </Link>
      )}
    </div>
  )
}
