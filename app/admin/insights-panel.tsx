import Link from "next/link"
import { supabaseAdmin } from "@/supabase/admin-client"
import { nowMs } from "@/lib/now"
import { Panel, rowLinkClass } from "./_components/ui"
import { fmtNumber, rs } from "./_components/format"

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

interface ExpiringRow {
  id: string
  order_number: string
  total: number
  created_at: string
  customer: { name: string | null; email: string | null } | null
}
interface StockProduct { id: string; name: string; stock_count: number; low_stock_threshold: number | null; product_variants: Array<{ is_active: boolean }> | null }
interface StockVariant { name: string; stock_count: number; low_stock_threshold: number | null; product: { id: string; name: string } | null }
interface SoldRow { product_name: string; quantity: number; total_price: number }
interface CouponOrder { coupon_code: string; total: number; discount_amount: number | null; payment_status: string }

function Row({ left, right, sub }: { left: React.ReactNode; right: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <li className="flex items-start justify-between gap-4 px-5 py-2.5">
      <div className="min-w-0">
        <div className="truncate">{left}</div>
        {sub && <p className="text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      <div className="shrink-0 text-right tabular-nums">{right}</div>
    </li>
  )
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="px-5 py-4 text-[13px] text-muted-foreground">{children}</p>

export async function InsightsPanel() {
  const now = nowMs()
  const since30 = new Date(now - 30 * DAY_MS).toISOString()

  const [expiring, products, variants, sold, couponOrders, paidOrders] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("id, order_number, total, created_at, customer:customers(name, email)")
      .eq("status", "pending")
      .eq("payment_status", "pending")
      .gt("created_at", new Date(now - 24 * HOUR_MS).toISOString())
      .order("created_at", { ascending: true })
      .limit(8),
    supabaseAdmin.from("products").select("id, name, stock_count, low_stock_threshold, product_variants(is_active)").not("published_at", "is", null).order("stock_count", { ascending: true }).limit(60),
    supabaseAdmin
      .from("product_variants")
      .select("name, stock_count, low_stock_threshold, product:products(id, name)")
      .eq("is_active", true)
      .order("stock_count", { ascending: true })
      .limit(60),
    supabaseAdmin
      .from("order_items")
      .select("product_name, quantity, total_price, orders!inner(status, payment_status, created_at)")
      .eq("orders.payment_status", "paid")
      .neq("orders.status", "cancelled")
      .gte("orders.created_at", since30)
      .limit(3000),
    supabaseAdmin.from("orders").select("coupon_code, total, discount_amount, payment_status").not("coupon_code", "is", null).neq("status", "cancelled").limit(2000),
    supabaseAdmin.from("orders").select("customer_id").eq("payment_status", "paid").neq("status", "cancelled").limit(5000),
  ])

  // 1. Bookings closest to expiring
  const expiringRows = (expiring.data ?? []) as unknown as ExpiringRow[]

  // 2. Low stock (products and sizes), emptiest first
  // A product sold in sizes keeps its stock on the sizes, so its own count of 0 doesn't mean sold out.
  const lowProducts = ((products.data ?? []) as unknown as StockProduct[])
    .filter((p) => !(p.product_variants ?? []).some((v) => v.is_active))
    .filter((p) => p.stock_count <= (p.low_stock_threshold ?? 5))
    .map((p) => ({ key: p.id, name: p.name, stock: p.stock_count, href: `/admin/products/${p.id}/edit` }))
  const lowVariants = ((variants.data ?? []) as unknown as StockVariant[])
    .filter((v) => v.product && v.stock_count <= (v.low_stock_threshold ?? 5))
    .map((v) => ({ key: `${v.product!.id}-${v.name}`, name: `${v.product!.name} (${v.name})`, stock: v.stock_count, href: `/admin/products/${v.product!.id}/edit` }))
  const lowStock = [...lowProducts, ...lowVariants].sort((a, b) => a.stock - b.stock).slice(0, 8)

  // 3. Top sellers, last 30 days
  const bySeller = new Map<string, { units: number; revenue: number }>()
  for (const r of (sold.data ?? []) as unknown as SoldRow[]) {
    const entry = bySeller.get(r.product_name) ?? { units: 0, revenue: 0 }
    entry.units += r.quantity
    entry.revenue += Number(r.total_price)
    bySeller.set(r.product_name, entry)
  }
  const topSellers = [...bySeller.entries()].sort((a, b) => b[1].units - a[1].units || b[1].revenue - a[1].revenue).slice(0, 8)

  // 4. Revenue by coupon (paid orders), all time
  const byCoupon = new Map<string, { orders: number; discount: number; revenue: number }>()
  for (const o of (couponOrders.data ?? []) as CouponOrder[]) {
    const entry = byCoupon.get(o.coupon_code) ?? { orders: 0, discount: 0, revenue: 0 }
    entry.orders += 1
    entry.discount += Number(o.discount_amount ?? 0)
    if (o.payment_status === "paid") entry.revenue += Number(o.total)
    byCoupon.set(o.coupon_code, entry)
  }
  const couponRows = [...byCoupon.entries()].sort((a, b) => b[1].revenue - a[1].revenue || b[1].orders - a[1].orders).slice(0, 8)

  // 5. Repeat customers: of everyone with a paid order, how many have two or more?
  const ordersPerCustomer = new Map<string, number>()
  for (const o of (paidOrders.data ?? []) as Array<{ customer_id: string | null }>) {
    if (o.customer_id) ordersPerCustomer.set(o.customer_id, (ordersPerCustomer.get(o.customer_id) ?? 0) + 1)
  }
  const buyers = ordersPerCustomer.size
  const repeaters = [...ordersPerCustomer.values()].filter((n) => n >= 2).length
  const repeatRate = buyers > 0 ? Math.round((repeaters / buyers) * 100) : 0

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Panel title="Bookings about to expire" description="Unpaid orders, oldest first. They're released 24 hours after booking." flush>
        {expiringRows.length === 0 ? (
          <Empty>No unpaid bookings right now.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {expiringRows.map((o) => {
              const hoursLeft = Math.max(0, Math.ceil((new Date(o.created_at).getTime() + 24 * HOUR_MS - now) / HOUR_MS))
              return (
                <Row
                  key={o.id}
                  left={
                    <Link href={`/admin/orders/${o.id}`} className={rowLinkClass}>
                      {o.order_number}
                    </Link>
                  }
                  sub={o.customer?.name || o.customer?.email || "Customer"}
                  right={
                    <>
                      <p className="font-medium">{rs(o.total)}</p>
                      <p className={`text-[13px] ${hoursLeft <= 6 ? "text-amber-800" : "text-muted-foreground"}`}>{hoursLeft}h left</p>
                    </>
                  }
                />
              )
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Low stock" description="Emptiest first. Includes sold-out items." flush>
        {lowStock.length === 0 ? (
          <Empty>Everything is comfortably stocked.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {lowStock.map((p) => (
              <Row
                key={p.key}
                left={
                  <Link href={p.href} className={rowLinkClass}>
                    {p.name}
                  </Link>
                }
                right={<span className={p.stock === 0 ? "font-medium text-red-700" : "font-medium"}>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</span>}
              />
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Top sellers" description="Last 30 days, paid orders." flush>
        {topSellers.length === 0 ? (
          <Empty>No paid orders in the last 30 days.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {topSellers.map(([name, s]) => (
              <Row key={name} left={name} sub={rs(s.revenue)} right={<span className="font-medium">{fmtNumber(s.units)} sold</span>} />
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Revenue by coupon" description="Paid revenue from orders that used each code." flush>
        {couponRows.length === 0 ? (
          <Empty>No orders have used a coupon yet.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {couponRows.map(([code, c]) => (
              <Row
                key={code}
                left={<span className="font-mono">{code}</span>}
                sub={`${fmtNumber(c.orders)} ${c.orders === 1 ? "order" : "orders"} · ${rs(c.discount)} given away`}
                right={<span className="font-medium">{rs(c.revenue)}</span>}
              />
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Repeat customers" description="Customers with a paid order who came back for another." className="lg:col-span-2">
        {buyers === 0 ? (
          <p className="text-[13px] text-muted-foreground">No paid orders yet.</p>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
            <p>
              <span className="text-3xl font-semibold tabular-nums">{repeatRate}%</span> <span className="text-muted-foreground">repeat rate</span>
            </p>
            <p className="text-[13px] text-muted-foreground">
              {fmtNumber(repeaters)} of {fmtNumber(buyers)} customers ordered more than once.
            </p>
          </div>
        )}
      </Panel>
    </div>
  )
}
