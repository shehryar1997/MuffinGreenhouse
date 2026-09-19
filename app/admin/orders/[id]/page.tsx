import Link from "next/link"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { markPaid, markDelivered, cancelOrder } from "./actions"
import { MarkShippedDialog } from "./mark-shipped-dialog"
import { ConfirmSubmitButton } from "../../_components/confirm-submit-button"
import { whatsAppLink } from "@/lib/whatsapp-link"
import { paymentAccountsAsText } from "@/config/payment-accounts"

// Force fresh data on every load — same reasoning as the orders list page.
export const dynamic = "force-dynamic"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
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

  const markPaidForOrder = markPaid.bind(null, order.id)
  const markDeliveredForOrder = markDelivered.bind(null, order.id)
  const cancelOrderForOrder = cancelOrder.bind(null, order.id)

  // WhatsApp click-to-chat (opens WhatsApp with the message ready; you press send).
  const customerFirstName = customer?.name?.trim().split(/\s+/)[0]
  const whatsappPhone = customer?.phone || address?.phone || null
  const awaitingPayment = order.payment_status !== "paid" && order.status !== "cancelled"
  const whatsappMessage = awaitingPayment
    ? `Hi ${customerFirstName ?? "there"}! This is Muffin Plants. Your order ${order.order_number} is booked and your items are on hold for 24 hours. Total: Rs ${order.total}.\n\nPlease send your payment to any one of these accounts within 24 hours and share the receipt here to confirm your booking:\n\n${paymentAccountsAsText()}`
    : `Hi ${customerFirstName ?? "there"}! This is Muffin Plants, writing about your order ${order.order_number}.`
  const whatsappHref = whatsAppLink(whatsappPhone, whatsappMessage)

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
              {/* Confirmation added: this e-mails the customer and can't be undone. Hidden on cancelled orders. */}
              {order.payment_status !== "paid" && order.status !== "cancelled" && (
                <form action={markPaidForOrder}>
                  <ConfirmSubmitButton
                    message={`Mark order ${order.order_number} as paid? The customer will be e-mailed an order confirmation. This can't be undone.`}
                    className="bg-[#E85D2C] text-white rounded px-4 py-2 text-sm font-medium hover:bg-[#d45124]"
                  >
                    Mark as Paid
                  </ConfirmSubmitButton>
                </form>
              )}
              {order.status !== "shipped" && order.status !== "delivered" && order.status !== "cancelled" && (
                <MarkShippedDialog orderId={order.id} />
              )}
              {order.status !== "delivered" && order.status !== "cancelled" && (
                <form action={markDeliveredForOrder}>
                  <ConfirmSubmitButton
                    message={`Mark order ${order.order_number} as delivered?`}
                    className="bg-white border rounded px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                  >
                    Mark as Delivered
                  </ConfirmSubmitButton>
                </form>
              )}
              {/* Shipped plants have left the greenhouse, so their stock can't be returned: no cancel from here on. */}
              {order.status !== "cancelled" && order.status !== "delivered" && order.status !== "shipped" && (
                <form action={cancelOrderForOrder}>
                  <ConfirmSubmitButton
                    message={`Cancel order ${order.order_number}? Its plants go back in stock.${order.payment_status !== "paid" ? " The customer will be e-mailed that the order was cancelled because the invoice wasn't cleared." : " This order is already paid, so no cancellation e-mail will be sent."}`}
                    className="bg-white border border-red-200 text-red-700 rounded px-4 py-2 text-sm font-medium hover:bg-red-50"
                  >
                    Cancel Order
                  </ConfirmSubmitButton>
                </form>
              )}
            </div>
            {order.tracking_number && (
              <div className="mt-4 pt-4 border-t text-sm text-neutral-600">
                <span className="font-medium text-neutral-900">{order.courier || "Courier"} tracking:</span>{" "}
                <span className="font-mono">{order.tracking_number}</span>
              </div>
            )}
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
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded bg-[#25D366] px-3 py-2 text-xs font-medium text-white hover:bg-[#128C7E]"
                  >
                    {awaitingPayment ? "WhatsApp payment details" : "Message on WhatsApp"}
                  </a>
                ) : (
                  <p className="mt-3 text-xs text-neutral-500">No phone number on file for WhatsApp.</p>
                )}
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
