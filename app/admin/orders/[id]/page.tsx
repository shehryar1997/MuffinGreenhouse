import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"

// Force fresh data on every load — same reasoning as the orders list page.
export const dynamic = "force-dynamic"

interface OrderDetailPageProps {
  params: { id: string }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      `id, order_number, status, payment_status, payment_method, delivery_type, subtotal,
       delivery_fee, total, customer_notes, internal_notes, created_at,
       customer:customers(id, name, email, phone),
       address:addresses(label, street, city, province, phone),
       order_items:order_items(id, product_name, variant_name, quantity, unit_price, total_price)`
    )
    .eq("id", params.id)
    .maybeSingle()

  if (!order) {
    notFound()
  }

  const customer = order.customer as unknown as { id: string; name: string | null; email: string; phone: string | null } | null
  const address = order.address as unknown as { label: string; street: string; city: string; province: string; phone: string | null } | null
  const items = (order.order_items as unknown as Array<{ id: string; product_name: string; variant_name: string | null; quantity: number; unit_price: number; total_price: number }>) || []

  async function markPaid() {
    "use server"
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid", status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", params.id)
    if (error) throw new Error(error.message)
    redirect(`/admin/orders/${params.id}`)
  }

  async function markShipped() {
    "use server"
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: "shipped", shipped_at: new Date().toISOString() })
      .eq("id", params.id)
    if (error) throw new Error(error.message)
    redirect(`/admin/orders/${params.id}`)
  }

  async function markDelivered() {
    "use server"
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("id", params.id)
    if (error) throw new Error(error.message)
    redirect(`/admin/orders/${params.id}`)
  }

  async function cancelOrder() {
    "use server"
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", params.id)
    if (error) throw new Error(error.message)
    redirect(`/admin/orders/${params.id}`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">Order {order.order_number}</h1>
        <Link href="/admin/orders" className="text-sm text-neutral-600 hover:text-neutral-900">
          ← Back to orders
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Status & actions */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                Status: {order.status}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                Payment: {order.payment_status}
              </span>
              {order.payment_method && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 capitalize">
                  {order.payment_method.replace("_", " ")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {order.payment_status !== "paid" && (
                <form action={markPaid}>
                  <button type="submit" className="bg-[#E85D2C] text-white rounded px-4 py-2 text-sm font-medium hover:bg-[#d45124]">
                    Mark as Paid
                  </button>
                </form>
              )}
              {order.status !== "shipped" && order.status !== "delivered" && order.status !== "cancelled" && (
                <form action={markShipped}>
                  <button type="submit" className="bg-white border rounded px-4 py-2 text-sm font-medium hover:bg-neutral-50">
                    Mark as Shipped
                  </button>
                </form>
              )}
              {order.status !== "delivered" && order.status !== "cancelled" && (
                <form action={markDelivered}>
                  <button type="submit" className="bg-white border rounded px-4 py-2 text-sm font-medium hover:bg-neutral-50">
                    Mark as Delivered
                  </button>
                </form>
              )}
              {order.status !== "cancelled" && order.status !== "delivered" && (
                <form action={cancelOrder}>
                  <button type="submit" className="bg-white border border-red-200 text-red-700 rounded px-4 py-2 text-sm font-medium hover:bg-red-50">
                    Cancel Order
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-serif mb-4">Items ({items.length})</h2>
            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between border-b last:border-b-0 pb-2 last:pb-0">
                  <span>
                    {item.quantity}× {item.product_name}
                    {item.variant_name && ` (${item.variant_name})`}
                  </span>
                  <span>Rs {item.total_price}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 space-y-1 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>Rs {order.subtotal}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Delivery</span>
                <span>Rs {order.delivery_fee}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>Rs {order.total}</span>
              </div>
            </div>
            {order.customer_notes && (
              <p className="text-sm text-neutral-500 mt-4 italic">Note from customer: {order.customer_notes}</p>
            )}
          </div>
        </div>

        {/* Sidebar: customer + delivery */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-serif mb-4">Customer</h2>
            {customer ? (
              <div className="text-sm space-y-1">
                <p className="font-medium">{customer.name || "—"}</p>
                <p className="text-neutral-600">{customer.email}</p>
                <p className="text-neutral-600">{customer.phone || "—"}</p>
                <Link href={`/admin/customers/${customer.id}`} className="text-[#E85D2C] hover:underline text-xs">
                  View customer profile
                </Link>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Guest order — no linked account.</p>
            )}
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-serif mb-4">Delivery</h2>
            <p className="text-sm text-neutral-600 capitalize mb-2">{order.delivery_type}</p>
            {address ? (
              <div className="text-sm space-y-1">
                <p className="font-medium">{address.label}</p>
                <p className="text-neutral-600">{address.street}</p>
                <p className="text-neutral-600">{address.city}, {address.province}</p>
                {address.phone && <p className="text-neutral-600">{address.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Self pickup — no delivery address.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
