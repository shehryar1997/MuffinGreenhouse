import Link from "next/link"
import { supabaseAdmin } from "@/supabase/admin-client"

// Force fresh data on every load — orders and payment status change often
// and admin should never see a stale list.
export const dynamic = "force-dynamic"

function statusBadgeClass(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  }
  return colors[status] || "bg-neutral-100 text-neutral-600"
}

function paymentBadgeClass(status: string): string {
  const colors: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-neutral-100 text-neutral-600",
  }
  return colors[status] || "bg-yellow-100 text-yellow-800"
}

export default async function AdminOrdersPage() {
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, order_number, status, payment_status, total, delivery_type, created_at, tracking_number, courier, customer:customers(name, email)"
    )
    .order("created_at", { ascending: false })

  if (error) {
    return <p className="text-red-600">Error loading orders: {error.message}</p>
  }

  const orderData = orders ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">Orders ({orderData.length})</h1>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tracking #</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orderData.map((o) => {
              const customer = o.customer as unknown as { name: string | null; email: string } | null
              return (
                <tr key={o.id} className="border-t hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="px-4 py-3">
                    {customer ? (customer.name || customer.email) : "—"}
                  </td>
                  <td className="px-4 py-3 capitalize">{o.delivery_type}</td>
                  <td className="px-4 py-3">Rs {o.total}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentBadgeClass(o.payment_status)}`}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                    {o.tracking_number ? `${o.courier || "Courier"}: ${o.tracking_number}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/orders/${o.id}`} className="text-[#E85D2C] hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              )
            })}
            {orderData.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-neutral-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
