import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Clock, Truck, Package, CheckCircle, AlertCircle, MessageCircle } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/nav.config"
import { paymentAccountsAsText } from "@/config/payment-accounts"

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