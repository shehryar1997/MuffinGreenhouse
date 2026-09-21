import Image from "next/image"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { PageHeader } from "../../../_components/ui"
import { fmtDateTime, plural, rs } from "../../../_components/format"
import { PrintButton } from "./print-button"
import { realEmail, visibleInternalNotes } from "@/lib/manual-order"

export const dynamic = "force-dynamic"

const STORE_ADDRESS = "A104, Block-C, Gulshan-e-Jamal, Karachi"
const STORE_PHONE = "+92 309 5360009"
const STORE_EMAIL = "support@muffinplants.com"

const LABEL = "mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500"

function Meta({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{label}</dt>
      <dd className={`mt-0.5 font-medium ${mono ? "font-mono" : "capitalize"}`}>{value}</dd>
    </div>
  )
}

interface OrderPrintPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderPrintPage({ params }: OrderPrintPageProps) {
  const { id } = await params

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      `id, order_number, status, payment_status, payment_method, delivery_type, subtotal,
       delivery_fee, discount_amount, coupon_code, total, customer_notes, internal_notes, created_at,
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
  const internalNotes = visibleInternalNotes(order.internal_notes)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div>
      <style>{`
        @page { margin: 14mm; }
        @media print {
          .print-hide { display: none !important; }
          body { background: white !important; color: black !important; }
          .slip, .slip * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
      <article className="slip mx-auto max-w-[760px] rounded-lg border border-border bg-white p-10 text-[13px] leading-relaxed text-neutral-900 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <Image src="/logo-nav.png" alt="Muffin Plants" width={473} height={512} className="h-[72px] w-auto shrink-0 object-contain" priority />
            <div>
              <p className="font-serif text-[26px] leading-none">Muffin Plants</p>
              <p className="mt-2 text-neutral-600">{STORE_ADDRESS}</p>
              <p className="text-neutral-600">
                {STORE_PHONE} · {STORE_EMAIL}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Packing slip</p>
            <p className="mt-1.5 font-mono text-xl font-semibold leading-none">{order.order_number}</p>
            <p className="mt-2 text-neutral-600">{fmtDateTime(order.created_at)}</p>
          </div>
        </header>

        <div className="mt-6 h-[3px] bg-neutral-900" />

        <section className="no-break mt-6 grid grid-cols-2 gap-x-8 gap-y-5">
          <div>
            <h2 className={LABEL}>Customer</h2>
            <p className="font-semibold">{customer?.name || "Guest customer"}</p>
            {realEmail(customer?.email) && <p className="text-neutral-600">{customer?.email}</p>}
            <p className="text-neutral-600">{customer?.phone || "—"}</p>
          </div>
          <div>
            <h2 className={LABEL}>{order.delivery_type === "pickup" ? "Pickup" : "Deliver to"}</h2>
            {address ? (
              <>
                <p className="font-semibold">{address.label}</p>
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

        <dl className="no-break mt-6 grid grid-cols-4 divide-x divide-neutral-200 rounded-md border border-neutral-200 bg-neutral-50 py-3">
          <Meta label="Payment method" value={order.payment_method ? order.payment_method.replace(/_/g, " ") : "—"} />
          <Meta label="Payment status" value={order.payment_status ? order.payment_status.replace(/_/g, " ") : "—"} />
          <Meta label="Fulfilment" value={order.delivery_type === "pickup" ? "Pickup" : "Delivery"} />
          <Meta label={order.courier ? order.courier : "Tracking"} value={order.tracking_number || "—"} mono />
        </dl>

        <section className="mt-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-left text-[11px] uppercase tracking-wider text-white">
                <th scope="col" className="w-10 py-2 pl-3 pr-2 font-medium">#</th>
                <th scope="col" className="px-2 py-2 font-medium">Item</th>
                <th scope="col" className="w-14 px-2 py-2 text-right font-medium">Qty</th>
                <th scope="col" className="w-28 px-2 py-2 text-right font-medium">Unit price</th>
                <th scope="col" className="w-28 py-2 pl-2 pr-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="no-break border-b border-neutral-200">
                  <td className="py-3 pl-3 pr-2 align-top tabular-nums text-neutral-500">{i + 1}</td>
                  <td className="px-2 py-3 align-top">
                    <p className="font-medium">{item.product_name}</p>
                    {item.variant_name && <p className="text-neutral-600">{item.variant_name}</p>}
                  </td>
                  <td className="px-2 py-3 text-right align-top tabular-nums">{item.quantity}</td>
                  <td className="px-2 py-3 text-right align-top tabular-nums">{rs(item.unit_price)}</td>
                  <td className="py-3 pl-2 pr-3 text-right align-top font-medium tabular-nums">{rs(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="no-break mt-4 flex items-start justify-between gap-8">
            <p className="pt-1 text-neutral-500">
              {plural(itemCount, "item")} · {plural(items.length, "line")}
            </p>
            <dl className="w-64 space-y-1.5 tabular-nums">
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
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt>
                  <dd>− {rs(order.discount_amount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-neutral-900 pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{rs(order.total)}</dd>
              </div>
            </dl>
          </div>
        </section>

        {(order.customer_notes || internalNotes) && (
          <section className="no-break mt-8 space-y-3 rounded-md border border-neutral-200 p-4">
            {order.customer_notes && (
              <div>
                <h2 className={LABEL}>Customer note</h2>
                <p className="italic text-neutral-700">{order.customer_notes}</p>
              </div>
            )}
            {internalNotes && (
              <div>
                <h2 className={LABEL}>Internal notes</h2>
                <p className="whitespace-pre-line text-neutral-700">{internalNotes}</p>
              </div>
            )}
          </section>
        )}

        <section className="no-break mt-10 grid grid-cols-2 gap-10">
          <div>
            <div className="h-10 border-b border-neutral-400" />
            <p className="mt-1.5 text-xs text-neutral-500">Packed &amp; checked by</p>
          </div>
          <div>
            <div className="h-10 border-b border-neutral-400" />
            <p className="mt-1.5 text-xs text-neutral-500">Received by (name &amp; signature)</p>
          </div>
        </section>

        <footer className="no-break mt-10 border-t border-neutral-200 pt-4 text-center text-xs text-neutral-500">
          <p className="font-medium text-neutral-700">Thank you for choosing Muffin Plants.</p>
          <p className="mt-1">
            Questions? {STORE_EMAIL} · {STORE_PHONE}
          </p>
          <p className="mt-1">Printed {fmtDateTime(new Date())}</p>
        </footer>
      </article>
    </div>
  )
}
