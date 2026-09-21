import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Clock, Truck, Package, CheckCircle, AlertCircle, MessageCircle } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { ReviewForm } from "./review-form"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/nav.config"
import { PAYMENT_ACCOUNTS } from "@/config/payment-accounts"

export const dynamic = "force-dynamic"

interface OrderStatusPageProps {
  params: Promise<{ token: string }>
}

interface OrderWithDetails {
  id: string
  order_number: string
  public_token: string
  status: string
  payment_status: string
  payment_method: string | null
  delivery_type: "delivery" | "pickup"
  subtotal: number
  delivery_fee: number
  discount_amount: number | null
  total: number
  customer_notes: string | null
  created_at: string
  confirmed_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  tracking_number: string | null
  courier: string | null
  address: {
    label: string
    street: string
    city: string
    province: string
  } | null
  order_items: Array<{
    id: string
    product_id: string | null
    product_name: string
    variant_name: string | null
    quantity: number
    unit_price: number
    total_price: number
  }>
}

function fmtDate(dateString: string | null): string {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  })
}

function getTimeRemaining(createdAt: string): { expired: boolean; hours: number; minutes: number } {
  const deadline = new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1000)
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  if (diff <= 0) {
    return { expired: true, hours: 0, minutes: 0 }
  }
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { expired: false, hours, minutes }
}

function StatusBadge({ status, paymentStatus }: { status: string; paymentStatus: string }) {
  const getStatusConfig = () => {
    if (status === "cancelled") return { icon: AlertCircle, color: "text-red-600 bg-red-50", text: "Cancelled" }
    if (status === "delivered") return { icon: CheckCircle, color: "text-green-600 bg-green-50", text: "Delivered" }
    if (status === "shipped") return { icon: Truck, color: "text-blue-600 bg-blue-50", text: "Shipped" }
    if (paymentStatus === "paid") return { icon: CheckCircle, color: "text-emerald-600 bg-emerald-50", text: "Payment Received" }
    return { icon: Clock, color: "text-amber-600 bg-amber-50", text: "Pending Payment" }
  }
  const config = getStatusConfig()
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}>
      <Icon className="w-4 h-4" />
      {config.text}
    </span>
  )
}

function TimelineStep({
  title,
  date,
  active,
  completed,
  isLast,
}: {
  title: string
  date: string | null
  active: boolean
  completed: boolean
  isLast: boolean
}) {
  return (
    <div className={`flex gap-4 ${!isLast ? "pb-6" : ""}`}>
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            completed
              ? "bg-emerald-500 border-emerald-500 text-white"
              : active
              ? "bg-white border-emerald-500 text-emerald-500"
              : "bg-gray-100 border-gray-200 text-gray-200"
          }`}
        >
          {completed ? <CheckCircle className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
        </div>
        {!isLast && <div className={`w-0.5 flex-1 mt-1 ${completed ? "bg-emerald-500" : active ? "bg-emerald-200" : "bg-gray-200"}`} />}
      </div>
      <div className="flex-1 pt-1">
        <p className={`font-medium ${active || completed ? "text-foreground" : "text-muted-foreground"}`}>{title}</p>
        {date && <p className="text-sm text-muted-foreground">{fmtDate(date)}</p>}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: OrderStatusPageProps): Promise<Metadata> {
  const { token } = await params
  return {
    title: `Order Status #${token.slice(0, 8)}`,
    robots: { index: false, follow: false },
  }
}

function getCourierTrackingUrl(courier: string, trackingNumber: string): string {
  const lower = courier.toLowerCase()
  if (lower.includes("leopard")) return `https://track.codcallcourier.com/tracking/?tracking_numbers=${encodeURIComponent(trackingNumber)}`
  if (lower.includes("trax")) return `https://trax.pk/track/${encodeURIComponent(trackingNumber)}`
  if (lower.includes("tcs")) return `https://www.tcsexpress.com/track/${encodeURIComponent(trackingNumber)}`
  if (lower.includes("dhl")) return `https://www.dhl.com/pk-en/home/tracking/tracking-parcel.html?submit=1&tracking-id=${encodeURIComponent(trackingNumber)}`
  return `https://www.google.com/search?q=${encodeURIComponent(courier + " tracking " + trackingNumber)}`
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function OrderStatusPage({ params }: OrderStatusPageProps) {
  const { token } = await params
  // public_token is a UUID column; a malformed token would make Postgres error instead of returning no rows.
  if (!UUID_RE.test(token)) notFound()

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      `id, order_number, public_token, status, payment_status, payment_method, delivery_type,
       subtotal, delivery_fee, discount_amount, total, customer_notes, created_at, confirmed_at, shipped_at,
       delivered_at, cancelled_at, tracking_number, courier,
       address:addresses(label, street, city, province),
       order_items(id, product_id, product_name, variant_name, quantity, unit_price, total_price)`
    )
    .eq("public_token", token)
    .maybeSingle()

  if (error || !data) notFound()
  const order = data as unknown as OrderWithDetails

  // Items already reviewed (one review per order line).
  const { data: reviewRows } = await supabaseAdmin.from("reviews").select("order_item_id").in("order_item_id", order.order_items.map((i) => i.id))
  const reviewedItemIds = new Set((reviewRows ?? []).map((r) => r.order_item_id as string))

  const isCancelled = order.status === "cancelled"
  const isPaid = order.payment_status === "paid"
  const isShipped = order.status === "shipped" || order.status === "delivered"
  const isDelivered = order.status === "delivered"
  const isPickup = order.delivery_type === "pickup"
  const awaitingPayment = !isCancelled && !isPaid
  const remaining = awaitingPayment ? getTimeRemaining(order.created_at) : null

  const whatsappHref = `https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hi, I'm messaging about order ${order.order_number}.`
  )}`

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
      <header className="space-y-3">
        <p className="text-sm text-muted-foreground">Order</p>
        <h1 className="text-2xl font-semibold font-mono">{order.order_number}</h1>
        <StatusBadge status={order.status} paymentStatus={order.payment_status} />
        <p className="text-sm text-muted-foreground">Placed {fmtDate(order.created_at)}</p>
      </header>

      {awaitingPayment && remaining && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-4">
          {remaining.expired ? (
            <p className="text-sm text-amber-900">
              The 24-hour payment window has passed, so this order may be released. Message us on WhatsApp if you have
              already paid or would like to book again.
            </p>
          ) : (
            <p className="text-sm text-amber-900">
              Your items are on hold for another{" "}
              <strong>
                {remaining.hours}h {remaining.minutes}m
              </strong>
              . Send your payment to any account below and share the receipt on WhatsApp, quoting {order.order_number}.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.values(PAYMENT_ACCOUNTS).map((account) => (
              <div key={account.title} className="rounded-md bg-white p-3 text-sm space-y-1">
                <p className="font-medium">{account.title}</p>
                {account.details.map((d) => (
                  <p key={d.label} className="text-muted-foreground">
                    {d.label}: <span className="text-foreground break-all">{d.value}</span>
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {!isCancelled && (
        <section className="rounded-lg border p-5">
          <h2 className="mb-4 font-semibold">Progress</h2>
          <TimelineStep title="Order placed" date={order.created_at} active={false} completed isLast={false} />
          <TimelineStep title="Payment received" date={order.confirmed_at} active={!isPaid} completed={isPaid} isLast={false} />
          <TimelineStep
            title={isPickup ? "Ready for pickup" : "Shipped"}
            date={order.shipped_at}
            active={isPaid && !isShipped}
            completed={isShipped}
            isLast={false}
          />
          <TimelineStep
            title={isPickup ? "Picked up" : "Delivered"}
            date={order.delivered_at}
            active={isShipped && !isDelivered}
            completed={isDelivered}
            isLast
          />
        </section>
      )}

      {isCancelled && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          This order was cancelled on {fmtDate(order.cancelled_at)}. You are welcome to book again, subject to
          availability.
        </section>
      )}

      {order.tracking_number && (
        <section className="rounded-lg border p-5 space-y-2">
          <h2 className="flex items-center gap-2 font-semibold">
            <Truck className="w-4 h-4" /> Tracking
          </h2>
          <p className="text-sm text-muted-foreground">
            {order.courier ? `${order.courier} · ` : ""}
            <span className="font-mono text-foreground">{order.tracking_number}</span>
          </p>
          {order.courier && (
            <Button asChild variant="outline" size="sm">
              <a href={getCourierTrackingUrl(order.courier, order.tracking_number)} target="_blank" rel="noopener noreferrer">
                Track your shipment
              </a>
            </Button>
          )}
        </section>
      )}

      <section className="rounded-lg border p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Package className="w-4 h-4" /> Items
        </h2>
        <ul className="divide-y">
          {order.order_items.map((item) => (
            <li key={item.id} className="py-3 text-sm">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  {item.variant_name && <p className="text-muted-foreground">{item.variant_name}</p>}
                  <p className="text-muted-foreground">
                    {item.quantity} × {formatPrice(item.unit_price)}
                  </p>
                </div>
                <p className="font-medium">{formatPrice(item.total_price)}</p>
              </div>
              {isShipped && item.product_id &&
                (reviewedItemIds.has(item.id) ? (
                  <p className="mt-2 text-muted-foreground">Thanks for reviewing this item.</p>
                ) : (
                  <ReviewForm token={token} orderItemId={item.id} productName={item.product_name} />
                ))}
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Discount</dt>
              <dd>-{formatPrice(Number(order.discount_amount))}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd>{order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : "Free"}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border p-5 text-sm space-y-1">
        <h2 className="mb-2 font-semibold">{isPickup ? "Pickup" : "Delivery address"}</h2>
        {isPickup ? (
          <p className="text-muted-foreground">We will share the pickup address with you on WhatsApp once your order is ready.</p>
        ) : order.address ? (
          <address className="not-italic space-y-0.5">
            <p className="font-medium">{order.address.label}</p>
            <p className="text-muted-foreground">{order.address.street}</p>
            <p className="text-muted-foreground">
              {order.address.city}, {order.address.province}
            </p>
          </address>
        ) : (
          <p className="text-muted-foreground">—</p>
        )}
        {order.customer_notes && (
          <p className="pt-2 text-muted-foreground">
            <span className="font-medium text-foreground">Your notes:</span> {order.customer_notes}
          </p>
        )}
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" /> Message us on WhatsApp
          </a>
        </Button>
        <a href={`mailto:${siteConfig.email}`} className="text-sm text-muted-foreground underline">
          {siteConfig.email}
        </a>
      </section>
    </main>
  )
}