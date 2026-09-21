import Link from "next/link"
import { notFound } from "next/navigation"
import { MessageCircle, Printer } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { markPaid, markDelivered, cancelOrder, deleteOrder } from "./actions"
import { MarkShippedDialog } from "./mark-shipped-dialog"
import { DeleteButton } from "../../_components/delete-button"
import { deleteOrderDescription } from "../delete-order-description"
import { ConfirmSubmitButton } from "../../_components/confirm-submit-button"
import { Alert, ButtonLink, OrderStatusBadge, PageHeader, Panel, PaymentStatusBadge, buttonClass, linkClass, waButtonClass } from "../../_components/ui"
import { fmtDateTime, rs } from "../../_components/format"
import { whatsAppLink } from "@/lib/whatsapp-link"
import { paymentAccountsAsText } from "@/config/payment-accounts"
import { cn } from "@/lib/utils"
import { isManualOrder, realEmail } from "@/lib/manual-order"

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

  const cancelled = order.status === "cancelled"
  const canMarkPaid = order.payment_status !== "paid" && !cancelled
  const canShip = order.status !== "shipped" && order.status !== "delivered" && !cancelled
  const canDeliver = order.status !== "delivered" && !cancelled
  // Shipped plants have left the greenhouse, so their stock can't be returned: no cancel from here on.
  const canCancel = !cancelled && order.status !== "delivered" && order.status !== "shipped"

  const steps = [
    { label: "Placed", done: true },
    { label: "Paid", done: order.payment_status === "paid" },
    { label: "Shipped", done: order.status === "shipped" || order.status === "delivered" },
    { label: "Delivered", done: order.status === "delivered" },
  ]

  return (
    <div>
      <PageHeader
        title={`Order ${order.order_number}`}
        description={`Placed ${fmtDateTime(order.created_at)} · ${order.delivery_type === "pickup" ? "Pickup" : "Delivery"}${isManualOrder(order.internal_notes) ? " · Recorded from WhatsApp" : ""}`}
        back={{ href: "/admin/orders", label: "Orders" }}
        badges={
          <>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </>
        }
        actions={
          <>
            <ButtonLink href={`/admin/orders/${order.id}/print`}>
              <Printer className="h-4 w-4" aria-hidden />
              Packing slip
            </ButtonLink>
            <DeleteButton
              size="md"
              title="Delete this order?"
              description={deleteOrderDescription(order.order_number, order.status)}
              confirmLabel="Delete order"
              fallbackError="Couldn't delete the order. Check your connection and try again."
              action={deleteOrder.bind(null, order.id, true)}
            />
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Panel title="Fulfilment">
            {cancelled ? (
              <Alert tone="danger" title="This order was cancelled." />
            ) : (
              <ol className="grid grid-cols-4 gap-2">
                {steps.map((s) => (
                  <li key={s.label}>
                    <div className={cn("h-1 rounded-full", s.done ? "bg-forest-600" : "bg-border")} />
                    <p className={cn("mt-2 text-[13px]", s.done ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {s.label}
                      <span className="sr-only">{s.done ? " (done)" : " (not yet)"}</span>
                    </p>
                  </li>
                ))}
              </ol>
            )}

            {order.tracking_number && (
              <p className="mt-5 text-sm">
                <span className="text-muted-foreground">{order.courier || "Courier"} tracking</span>{" "}
                <span className="ml-1 font-mono font-medium">{order.tracking_number}</span>
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
              {/* Confirmation added: this e-mails the customer and can't be undone. Hidden on cancelled orders. */}
              {canMarkPaid && (
                <form action={markPaidForOrder}>
                  <ConfirmSubmitButton
                    title="Mark as paid?"
                    confirmLabel="Mark as paid"
                    message={`Mark order ${order.order_number} as paid? The customer will be e-mailed an order confirmation. This can't be undone.`}
                    className={buttonClass({ variant: "primary" })}
                  >
                    Mark as paid
                  </ConfirmSubmitButton>
                </form>
              )}
              {canShip && <MarkShippedDialog orderId={order.id} />}
              {canDeliver && (
                <form action={markDeliveredForOrder}>
                  <ConfirmSubmitButton
                    title="Mark as delivered?"
                    confirmLabel="Mark as delivered"
                    message={`Mark order ${order.order_number} as delivered?`}
                    className={buttonClass()}
                  >
                    Mark as delivered
                  </ConfirmSubmitButton>
                </form>
              )}
              {canCancel && (
                <form action={cancelOrderForOrder} className="sm:ml-auto">
                  <ConfirmSubmitButton
                    title="Cancel this order?"
                    confirmLabel="Cancel order"
                    cancelLabel="Keep order"
                    tone="danger"
                    message={`Cancel order ${order.order_number}? Its plants go back in stock.${order.payment_status !== "paid" ? " The customer will be e-mailed that the order was cancelled because the invoice wasn't cleared." : " This order is already paid, so no cancellation e-mail will be sent."}`}
                    className={buttonClass({ variant: "danger" })}
                  >
                    Cancel order
                  </ConfirmSubmitButton>
                </form>
              )}
              {!canMarkPaid && !canShip && !canDeliver && !canCancel && (
                <p className="text-sm text-muted-foreground">Nothing left to do on this order.</p>
              )}
            </div>
          </Panel>

          <Panel title={`Items (${items.length})`} flush>
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th scope="col" className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Item</th>
                  <th scope="col" className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Qty</th>
                  <th scope="col" className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Price</th>
                  <th scope="col" className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium">{item.product_name}</p>
                      {item.variant_name && <p className="text-[13px] text-muted-foreground">{item.variant_name}</p>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{item.quantity}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{rs(item.unit_price)}</td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">{rs(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ml-auto max-w-xs space-y-1.5 border-t border-border px-5 py-4 text-sm tabular-nums">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd>{rs(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>Delivery</dt>
                <dd>{rs(order.delivery_fee)}</dd>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <dt>
                    Discount
                    {order.coupon_code && <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">{order.coupon_code}</span>}
                  </dt>
                  <dd>− {rs(order.discount_amount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{rs(order.total)}</dd>
              </div>
            </dl>
            {order.customer_notes && (
              <div className="border-t border-border px-5 py-4">
                <p className="text-[13px] font-medium">Note from the customer</p>
                <p className="mt-1 text-sm italic text-muted-foreground">{order.customer_notes}</p>
              </div>
            )}
          </Panel>
        </div>

        {/* Sidebar: customer, delivery, payment */}
        <div className="space-y-6">
          <Panel title="Customer">
            {customer ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium">{customer.name || "—"}</p>
                {realEmail(customer.email) && (
                  <p>
                    <a href={`mailto:${customer.email}`} className="break-all text-muted-foreground hover:text-foreground hover:underline">
                      {customer.email}
                    </a>
                  </p>
                )}
                <p className="text-muted-foreground">{customer.phone || "—"}</p>
                <p className="pt-1">
                  <Link href={`/admin/customers/${customer.id}`} className={cn(linkClass, "text-[13px]")}>
                    View customer profile
                  </Link>
                </p>
                {whatsappHref ? (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={cn(waButtonClass, "mt-3 w-full")}>
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {awaitingPayment ? "WhatsApp payment details" : "Message on WhatsApp"}
                  </a>
                ) : (
                  <p className="pt-3 text-[13px] text-muted-foreground">No phone number on file for WhatsApp.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Guest order — no linked account.</p>
            )}
          </Panel>

          <Panel title={order.delivery_type === "pickup" ? "Pickup" : "Delivery"}>
            {address ? (
              <address className="space-y-0.5 text-sm not-italic">
                <p className="font-medium">{address.label}</p>
                <p className="text-muted-foreground">{address.street}</p>
                <p className="text-muted-foreground">
                  {address.city}, {address.province}
                </p>
                {address.phone && <p className="text-muted-foreground">{address.phone}</p>}
              </address>
            ) : (
              <p className="text-sm text-muted-foreground">Self pickup — no delivery address.</p>
            )}
          </Panel>

          <Panel title="Payment">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Method</dt>
                <dd className="capitalize">{order.payment_method ? order.payment_method.replace(/_/g, " ") : "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <PaymentStatusBadge status={order.payment_status} />
                </dd>
              </div>
            </dl>
          </Panel>

          {order.internal_notes && (
            <Panel title="Internal notes">
              <p className="whitespace-pre-line text-sm text-muted-foreground">{order.internal_notes}</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
