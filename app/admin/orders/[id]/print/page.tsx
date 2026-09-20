import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { PageHeader } from "../../../_components/ui"
import { fmtDateTime, rs } from "../../../_components/format"
import { PrintButton } from "./print-button"

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
    <div>
      <style>{`
        @page { margin: 14mm; }
        @media print {
          .print-hide { display: none !important; }
          body { background: white !important; color: black !important; }
          .no-break { page-break-inside: avoid; }
        }
      `}</style>

      {/* Print controls: on screen only */}
      <div className="print-hide">
        <PageHeader
          title="Packing slip"
          description={`Order ${order.order_number}`}
          back={{ href: `/admin/orders/${order.id}`, label: "Back to order" }}
          actions={<PrintButton />}
        />
      </div>

      {/* The slip itself: a sheet of paper on screen, the whole page when printed. */}
      <article className="mx-auto max-w-[720px] rounded-lg border border-border bg-white p-10 text-[13px] leading-relaxed text-neutral-900 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-6 border-b border-neutral-900 pb-5">
          <div>
            <p className="font-serif text-2xl leading-none">Muffin Plants</p>
            <p className="mt-2 text-neutral-600">Nursery Pickup Point, DHA Phase 6, Karachi</p>
            <p className="text-neutral-600">+92 300 123 4567</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Packing slip</p>
            <p className="mt-1 font-mono text-lg font-semibold">{order.order_number}</p>
            <p className="mt-1 text-neutral-600">{fmtDateTime(order.created_at)}</p>
          </div>
        </header>

        <section className="no-break mt-6 grid grid-cols-2 gap-8">
          <div>
            <h2 className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-neutral-500">Customer</h2>
            <p className="font-medium">{customer?.name || "Guest customer"}</p>
            <p className="text-neutral-600">{customer?.email || "—"}</p>
            <p className="text-neutral-600">{customer?.phone || "—"}</p>
          </div>
          <div>
            <h2 className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {order.delivery_type === "pickup" ? "Pickup" : "Deliver to"}
            </h2>
            {address ? (
              <>
                <p className="font-medium">{address.label}</p>
                <p className="text-neutral-600">{address.street}</p>
                <p className="text-neutral-600">
                  {address.city}, {address.province}
                </p>
                {address.phone && <p className="text-neutral-600">{address.phone}</p>}
              </>
            ) : (
              <p className="text-neutral-600">Self pickup — no delivery address.</p>
            )}
          </div>
        </section>

        <section className="no-break mt-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-900 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th scope="col" className="py-2 pr-2 font-medium">Item</th>
                <th scope="col" className="w-14 py-2 px-2 text-right font-medium">Qty</th>
                <th scope="col" className="w-28 py-2 px-2 text-right font-medium">Price</th>
                <th scope="col" className="w-28 py-2 pl-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-200">
                  <td className="py-2.5 pr-2">
                    <p className="font-medium">{item.product_name}</p>
                    {item.variant_name && <p className="text-neutral-600">{item.variant_name}</p>}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{item.quantity}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{rs(item.unit_price)}</td>
                  <td className="py-2.5 pl-2 text-right font-medium tabular-nums">{rs(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="ml-auto mt-4 max-w-[16rem] space-y-1 tabular-nums">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd>{rs(order.subtotal)}</dd>
            </div>
            {Number(order.delivery_fee) > 0 && (
              <div className="flex justify-between">
                <dt className="text-neutral-600">Delivery fee</dt>
                <dd>{rs(order.delivery_fee)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-neutral-900 pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{rs(order.total)}</dd>
            </div>
          </dl>
        </section>

        {(order.customer_notes || order.internal_notes) && (
          <section className="no-break mt-8 space-y-3 border-t border-neutral-200 pt-5">
            {order.customer_notes && (
              <div>
                <h2 className="mb-0.5 font-sans text-xs font-semibold uppercase tracking-wide text-neutral-500">Customer note</h2>
                <p className="italic text-neutral-700">{order.customer_notes}</p>
              </div>
            )}
            {order.internal_notes && (
              <div>
                <h2 className="mb-0.5 font-sans text-xs font-semibold uppercase tracking-wide text-neutral-500">Internal notes</h2>
                <p className="text-neutral-700">{order.internal_notes}</p>
              </div>
            )}
          </section>
        )}

        <footer className="no-break mt-10 border-t border-neutral-200 pt-4 text-center text-xs text-neutral-500">
          <p>Thank you for your order. Please check all items before accepting delivery.</p>
          <p className="mt-1">Printed {fmtDateTime(new Date())}</p>
        </footer>
      </article>
    </div>
  )
}
