import Link from "next/link"
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock,
  CreditCard,
  ArrowRight
} from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"

export const dynamic = "force-dynamic"

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-sky-600", bg: "bg-sky-50", icon: CheckCircle2 },
  processing: { label: "Processing", color: "text-violet-600", bg: "bg-violet-50", icon: Package },
  shipped: { label: "Shipped", color: "text-blue-600", bg: "bg-blue-50", icon: Truck },
  delivered: { label: "Delivered", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-500", bg: "bg-red-50", icon: XCircle },
}

const paymentConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50" },
  paid: { label: "Paid", color: "text-emerald-600", bg: "bg-emerald-50" },
  failed: { label: "Failed", color: "text-red-500", bg: "bg-red-50" },
  refunded: { label: "Refunded", color: "text-slate-500", bg: "bg-slate-50" },
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color,
  description 
}: { 
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  description?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-neutral-900 mt-2">{value}</p>
          {description && <p className="text-xs text-neutral-400 mt-1">{description}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )
}

export default async function AdminOrdersPage() {
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, order_number, status, payment_status, total, delivery_type, created_at, tracking_number, courier, customer:customers(name, email)"
    )
    .order("created_at", { ascending: false })

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Error loading orders</p>
          <p className="text-neutral-500 text-sm mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  const orderData = orders ?? []

  const shippedCount = orderData.filter((o) => o.status === "shipped" || o.status === "delivered").length
  const cancelledCount = orderData.filter((o) => o.status === "cancelled").length
  const revenue = orderData
    .filter((o) => o.payment_status === "paid" && o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-neutral-900">Orders</h1>
        <p className="text-neutral-500 mt-1">Manage customer orders and track shipments</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={orderData.length}
          icon={ShoppingCart}
          color="bg-neutral-900"
          description="All time orders"
        />
        <StatCard
          label="Shipped"
          value={shippedCount}
          icon={Package}
          color="bg-blue-500"
          description="Shipped or delivered"
        />
        <StatCard
          label="Cancelled"
          value={cancelledCount}
          icon={XCircle}
          color="bg-red-500"
        />
        <StatCard
          label="Revenue"
          value={`Rs ${revenue.toLocaleString("en-PK")}`}
          icon={CreditCard}
          color="bg-emerald-500"
          description="Paid orders only"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50/80 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orderData.map((o) => {
                const customer = o.customer as unknown as { name: string | null; email: string } | null
                const status = statusConfig[o.status] || statusConfig.pending
                const StatusIcon = status.icon
                const payment = paymentConfig[o.payment_status] || paymentConfig.pending

                return (
                  <tr key={o.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 flex items-center justify-center text-neutral-500">
                          <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{o.order_number}</p>
                          <p className="text-xs text-neutral-400 capitalize">{o.delivery_type} • {o.courier || "No courier"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-700">{customer?.name || customer?.email || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-neutral-900">Rs {o.total.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${payment.bg} ${payment.color}`}>
                        {payment.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#E85D2C] hover:bg-[#E85D2C]/10 rounded-lg transition-colors"
                      >
                        View
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {orderData.length === 0 && (
          <div className="py-16 text-center">
            <ShoppingCart className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 font-medium">No orders yet</p>
            <p className="text-neutral-400 text-sm mt-1">Orders will appear here when customers place them</p>
          </div>
        )}
      </div>
    </div>
  )
}
