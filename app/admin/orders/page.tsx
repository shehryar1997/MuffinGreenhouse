import Link from "next/link"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"
const PAGE_SIZE = 25

export default async function AdminOrdersPage(props: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireAdmin()
  const params = await props.searchParams

  const { status, page } = params
  const currentPage = Math.max(1, parseInt(page || "1", 10))
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Fetch orders with pagination
  let query = supabaseAdmin
    .from("orders")
    .select("id, order_number, status, payment_status, total, delivery_type, created_at, tracking_number, courier, customer:customers(name, email, phone)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  const { data: orders, count, error } = await query

  if (error) {
    console.error("Error fetching orders:", error)
  }

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const ordersList = orders || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-neutral-900">Orders</h1>
        <p className="text-neutral-500 mt-1">Manage and track orders</p>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
          <Link
            key={s}
            href={`/admin/orders${s === "all" ? "" : `?status=${s}`}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              status === s || (!status && s === "all")
                ? "bg-[#E85D2C] text-white"
                : "bg-white border text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 text-left text-sm font-medium text-neutral-600">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm">
            {ordersList.map((o: any) => {
              const customer = o.customer as { name: string | null; email: string } | null
              return (
                <tr key={o.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.order_number}</p>
                    <p className="text-xs text-neutral-400 capitalize">{o.delivery_type}</p>
                  </td>
                  <td className="px-4 py-3">{customer?.name || customer?.email || "Guest"}</td>
                  <td className="px-4 py-3 font-medium">Rs {Number(o.total).toLocaleString("en-PK")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      o.status === "pending" ? "bg-amber-100 text-amber-700" :
                      o.status === "confirmed" ? "bg-sky-100 text-sky-700" :
                      o.status === "shipped" ? "bg-blue-100 text-blue-700" :
                      o.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{new Date(o.created_at).toLocaleDateString("en-PK")}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/orders/${o.id}`} className="text-[#E85D2C] hover:underline">View</Link>
                  </td>
                </tr>
              )
            })}
            {ordersList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Showing {from + 1}-{Math.min(to + 1, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link href={`/admin/orders?page=${currentPage - 1}${status ? `&status=${status}` : ""}`} className="px-3 py-1 text-sm border rounded hover:bg-neutral-50">
                Previous
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/admin/orders?page=${p}${status ? `&status=${status}` : ""}`}
                className={`px-3 py-1 text-sm rounded ${p === currentPage ? "bg-[#E85D2C] text-white" : "border hover:bg-neutral-50"}`}
              >
                {p}
              </Link>
            ))}
            {currentPage < totalPages && (
              <Link href={`/admin/orders?page=${currentPage + 1}${status ? `&status=${status}` : ""}`} className="px-3 py-1 text-sm border rounded hover:bg-neutral-50">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
