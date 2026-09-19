"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { Printer } from "lucide-react"

export const dynamic = "force-dynamic"

interface OrderPrintPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderPrintPage({ params }: OrderPrintPageProps) {
  const { id } = await params

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      `id, order_number, status, payment_status, payment_method, delivery_type, subtotal,
       delivery_fee, total, customer_notes, internal_notes, created_at,
       tracking_number, courier,
       customer:customers(id, name, email, phone),
       address:addresses(label, street, city, province, phone),
       order_items:order_items(id, product_name, variant_name, quantity, unit_price, total_price)`
    )
    .eq("id", id)
    .maybeSingle()

  if (!order) {
    notFound()
  }

  const customer = order.customer as unknown as { id: string; name: string | null; email: string; phone: string | null } | null
  const address = order.address as unknown as { label: string; street: string; city: string; province: string; phone: string | null } | null
  const items = (order.order_items as unknown as Array<{ id: string; product_name: string; variant_name: string | null; quantity: number; unit_price: number; total_price: number }>) || []

  return (
    <div className="min-h-screen bg-white p-8">
      <style jsx global>{`
        @media print {
          .print-hide {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .no-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Print controls */}
      <div className="print-hide mb-6 flex items-center justify-between">
        <Link 
          href={`/admin/orders/${order.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          ← Back to Order
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#E85D2C] text-white rounded-lg hover:bg-[#E85D2C]/90"
        >
          <Printer className="h-4 w-4" />
          Print Packing Slip
        </button>
      </div>

      {/* Packing slip content */}
      <div className="max-w-2xl mx-auto border border-neutral-300 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-2">Muffin Plants</h1>
          <p className="text-neutral-600">Nursery Pickup Point, DHA Phase 6, Karachi</p>
          <p className="text-neutral-600">Phone: +92 300 123 4567</p>
        </div>

        <div className="border-t border-b border-neutral-300 py-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Order #{order.order_number}</h2>
              <p className="text-neutral-600">
                Placed: {new Date(order.created_at).toLocaleDateString("en-PK", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                order.status === "shipped" || order.status === "delivered" ? "bg-emerald-50 text-emerald-700" :
                order.status === "cancelled" ? "bg-red-50 text-red-700" :
                order.status === "pending" ? "bg-amber-50 text-amber-700" :
                "bg-sky-50 text-sky-700"
              }`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 no-break">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">Customer</h3>
            <div className="space-y-1">
              <p className="font-medium">{customer?.name || "Guest Customer"}</p>
              <p className="text-neutral-600">{customer?.email || "—"}</p>
              <p className="text-neutral-600">{customer?.phone || "—"}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">
              {order.delivery_type === "pickup" ? "Pickup Details" : "Delivery Address"}
            </h3>
            {address ? (
              <div className="space-y-1">
                <p className="font-medium">{address.label}</p>
                <p className="text-neutral-600">{address.street}</p>
                <p className="text-neutral-600">{address.city}, {address.province}</p>
                {address.phone && <p className="text-neutral-600">{address.phone}</p>}
                {order.delivery_type === "delivery" && (
                  <p className="text-neutral-600">Delivery Fee: Rs {Number(order.delivery_fee).toLocaleString("en-PK")}</p>
                )}
              </div>
            ) : (
              <p className="text-neutral-600">Self pickup — no delivery address.</p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-8 no-break">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Order Items</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-300">
                <th className="text-left py-2 px-1 text-sm font-medium text-neutral-700">Item</th>
                <th className="text-right py-2 px-1 text-sm font-medium text-neutral-700">Quantity</th>
                <th className="text-right py-2 px-1 text-sm font-medium text-neutral-700">Price</th>
                <th className="text-right py-2 px-1 text-sm font-medium text-neutral-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-200">
                  <td className="py-3 px-1">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      {item.variant_name && (
                        <p className="text-sm text-neutral-600">Variant: {item.variant_name}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-1 text-right">{item.quantity}</td>
                  <td className="py-3 px-1 text-right">Rs {Number(item.unit_price).toLocaleString("en-PK")}</td>
                  <td className="py-3 px-1 text-right font-medium">
                    Rs {Number(item.total_price).toLocaleString("en-PK")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-neutral-300 pt-6 mb-8 no-break">
          <div className="max-w-xs ml-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-600">Subtotal</span>
              <span>Rs {Number(order.subtotal).toLocaleString("en-PK")}</span>
            </div>
            {Number(order.delivery_fee) > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-600">Delivery Fee</span>
                <span>Rs {Number(order.delivery_fee).toLocaleString("en-PK")}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-neutral-300 pt-2 mt-2">
              <span>Total</span>
              <span>Rs {Number(order.total).toLocaleString("en-PK")}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {(order.customer_notes || order.internal_notes) && (
          <div className="border-t border-neutral-300 pt-6 no-break">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">Notes</h3>
            {order.customer_notes && (
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-700 mb-1">Customer Note:</p>
                <p className="text-sm text-neutral-600 italic">{order.customer_notes}</p>
              </div>
            )}
            {order.internal_notes && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-1">Internal Notes:</p>
                <p className="text-sm text-neutral-600">{order.internal_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-neutral-300 pt-6 mt-8 text-center text-sm text-neutral-500 no-break">
          <p>Thank you for your order!</p>
          <p>Please check all items before accepting delivery.</p>
          <p className="mt-4">
            Printed: {new Date().toLocaleDateString("en-PK", { 
              year: "numeric", 
              month: "long", 
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </div>
      </div>
    </div>
  )
}