import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { Alert, EmptyState, FilterTabs, OrderStatusBadge, PageHeader, PaymentStatusBadge, TableShell, Td, Th, Thead, Tr, buttonClass, rowLinkClass } from "../_components/ui"
import { fmtDate, fmtNumber, plural, rs } from "../_components/format"

export const dynamic = "force-dynamic"
const PAGE_SIZE = 25

interface OrderRow {
  id: string
  order_number: string
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  payment_status: "pending" | "paid" | "failed" | "refunded"
  total: number
  delivery_type: "delivery" | "pickup"
  created_at: string
  tracking_number: string | null
  courier: string | null
  customer: { name: string | null; email: string; phone?: string | null } | { name: string | null; email: string; phone?: string | null }[] | null
}

const STATUSES = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"]

export default async function AdminOrdersPage(props: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireAdmin()
  const params = await props.searchParams

  const { status, page } = params
  const currentPage = Math.max(1, parseInt(page || "1", 10))
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Fetch orders with pagination
  let query = supabaseAdmin
    .from("orders")
    .select("id, order_number, status, payment_status, total, delivery_type, created_at, tracking_number, courier, customer:customers(name, email, phone)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  const { data: orders, count, error } = await query

  if (error) {
    console.error("Error fetching orders:", error)
  }

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const ordersList = orders || []
  const pageHref = (p: number) => `/admin/orders?page=${p}${status ? `&status=${status}` : ""}`

  return (
    <div>
      <PageHeader title="Orders" description={`${plural(totalCount, "order")}${status && status !== "all" ? ` ${status}` : ""}`} />

      {error && (
        <Alert tone="danger" title="Couldn't load orders" className="mb-6">
          Try refreshing the page.
        </Alert>
      )}

      <div className="mb-4">
        <FilterTabs
          label="Order status"
          items={STATUSES.map((s) => ({
            href: `/admin/orders${s === "all" ? "" : `?status=${s}`}`,
            label: s.charAt(0).toUpperCase() + s.slice(1),
            active: status === s || (!status && s === "all"),
          }))}
        />
      </div>

      {ordersList.length === 0 ? (
        <EmptyState title="No orders found" description={status && status !== "all" ? `Nothing is marked ${status} right now.` : "Orders show up here as customers place them."} />
      ) : (
        <TableShell minWidth="min-w-[820px]">
          <Thead>
            <tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th align="right">Total</Th>
              <Th>Payment</Th>
              <Th>Status</Th>
              <Th>Placed</Th>
              <Th />
            </tr>
          </Thead>
          <tbody>
            {ordersList.map((o: OrderRow) => {
              const customer = o.customer as { name: string | null; email: string } | null
              return (
                <Tr key={o.id}>
                  <Td>
                    <Link href={`/admin/orders/${o.id}`} className={`${rowLinkClass} font-mono text-[13px]`}>
                      {o.order_number}
                    </Link>
                    <p className="mt-0.5 text-xs capitalize text-muted-foreground">{o.delivery_type}</p>
                  </Td>
                  <Td>
                    {customer?.name || customer?.email || <span className="text-muted-foreground">Guest</span>}
                  </Td>
                  <Td align="right" className="font-medium tabular-nums">{rs(o.total)}</Td>
                  <Td><PaymentStatusBadge status={o.payment_status} /></Td>
                  <Td><OrderStatusBadge status={o.status} /></Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{fmtDate(o.created_at)}</Td>
                  <Td align="right">
                    <Link href={`/admin/orders/${o.id}`} className={buttonClass({ size: "sm" })}>
                      View
                    </Link>
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </TableShell>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-4">
          <p className="text-[13px] tabular-nums text-muted-foreground">
            {fmtNumber(from + 1)}–{fmtNumber(Math.min(to + 1, totalCount))} of {fmtNumber(totalCount)}
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link href={pageHref(currentPage - 1)} className={buttonClass({ size: "sm" })}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Previous
              </Link>
            ) : null}
            <span className="px-2 text-[13px] tabular-nums text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link href={pageHref(currentPage + 1)} className={buttonClass({ size: "sm" })}>
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </div>
        </nav>
      )}
    </div>
  )
}
