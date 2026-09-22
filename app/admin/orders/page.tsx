import Link from "next/link"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { Alert, ButtonLink, EmptyState, FilterTabs, OrderStatusBadge, PageHeader, PaymentStatusBadge, TableShell, Td, Th, Thead, Tr, buttonClass, rowLinkClass } from "../_components/ui"
import { fmtDate, fmtNumber, plural, rs } from "../_components/format"
import { realEmail } from "@/lib/manual-order"
import { DeleteButton } from "../_components/delete-button"
import { deleteOrder, deleteOrders } from "./[id]/actions"
import { canDeleteOrder, deleteOrderDescription } from "./delete-order-description"
import { BulkSelect, RowCheck, SelectAllCheck } from "../_components/bulk-select"
import { OrdersSearchFilters } from "./orders-search-filters"
import { sanitizeSearchTerm } from "@/lib/search-term"

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
const PAYMENTS = ["pending", "paid", "failed", "refunded"]

export default async function AdminOrdersPage(props: { searchParams: Promise<{ status?: string; page?: string; q?: string; payment?: string }> }) {
  await requireAdmin()
  const params = await props.searchParams

  const status = params.status && STATUSES.includes(params.status) ? params.status : undefined
  const payment = params.payment && PAYMENTS.includes(params.payment) ? params.payment : ""
  const q = sanitizeSearchTerm(params.q)
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1)
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
  if (payment) {
    query = query.eq("payment_status", payment)
    // "Awaiting payment" means orders that can still be paid: cancelled ones are over.
    if (payment === "pending" && !status) query = query.neq("status", "cancelled")
  }
  if (q) {
    // Customers matching the name, e-mail or phone (phones compared by their last digits, so "0300 1234567"
    // finds "+92 300 1234567"), plus the order number itself.
    const digits = q.replace(/\D/g, "")
    const phoneTail = digits.length >= 6 ? digits.slice(-7) : ""
    const customerFilters = [`name.ilike.%${q}%`, `email.ilike.%${q}%`, ...(phoneTail ? [`phone.ilike.%${phoneTail}%`] : [])]
    const { data: matches } = await supabaseAdmin.from("customers").select("id").or(customerFilters.join(",")).limit(200)
    const ids = (matches ?? []).map((m) => m.id as string)
    query = query.or([`order_number.ilike.%${q}%`, ...(ids.length ? [`customer_id.in.(${ids.join(",")})`] : [])].join(","))
  }

  const { data: orders, count, error } = await query

  if (error) {
    console.error("Error fetching orders:", error)
  }

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const ordersList = orders || []
  const pageHref = (p: number) => {
    const search = new URLSearchParams({ page: String(p) })
    if (status) search.set("status", status)
    if (payment) search.set("payment", payment)
    if (q) search.set("q", q)
    return `/admin/orders?${search.toString()}`
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`${plural(totalCount, "order")}${status && status !== "all" ? ` ${status}` : ""}${payment === "pending" ? " awaiting payment" : payment ? ` · payment ${payment}` : ""}${q ? ` matching “${q}”` : ""}`}
        actions={
          <ButtonLink href="/admin/orders/new" variant="primary">
            <Plus className="h-4 w-4" aria-hidden />
            Add order
          </ButtonLink>
        }
      />

      {error && (
        <Alert tone="danger" title="Couldn't load orders" className="mb-6">
          Try refreshing the page.
        </Alert>
      )}

      <div className="mb-4 space-y-3">
        <OrdersSearchFilters q={q} status={status ?? "all"} payment={payment} />
        <FilterTabs
          label="Order status"
          items={STATUSES.map((s) => ({
            href: `/admin/orders${s === "all" ? "" : `?status=${s}`}`,
            label: s.charAt(0).toUpperCase() + s.slice(1),
            active: status === s || (!status && s === "all"),
          }))}
        />
      </div>

      <BulkSelect
        ids={ordersList.map((o: OrderRow) => o.id)}
        noun="order"
        description="Only unpaid orders that haven't shipped (tests, duplicates, no-shows) can be deleted: they are cancelled first, so their plants go back in stock. Paid, shipped and delivered orders are kept as your sales record and are reported instead. Customers are not e-mailed. This cannot be undone."
        action={deleteOrders}
      >
        {ordersList.length === 0 ? (
          <EmptyState title="No orders found" description={q ? `No order matches “${q}”.` : status && status !== "all" ? `Nothing is marked ${status} right now.` : payment ? "No orders with that payment status." : "Orders show up here as customers place them."} />
        ) : (
          <TableShell minWidth="min-w-[860px]">
            <Thead>
              <tr>
                <Th className="w-10"><SelectAllCheck label="Select all orders on this page" /></Th>
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
                const customer = (Array.isArray(o.customer) ? o.customer[0] : o.customer) ?? null
                return (
                  <Tr key={o.id} className="has-[[data-row-check]:checked]:bg-forest-50/60">
                    <Td className="w-10">
                      <RowCheck id={o.id} label={`order ${o.order_number}`} />
                    </Td>
                    <Td>
                      <Link href={`/admin/orders/${o.id}`} className={`${rowLinkClass} font-mono text-[13px]`}>
                        {o.order_number}
                      </Link>
                      <p className="mt-0.5 text-xs capitalize text-muted-foreground">{o.delivery_type}</p>
                    </Td>
                    <Td>
                      {customer?.name || realEmail(customer?.email) || customer?.phone || <span className="text-muted-foreground">Guest</span>}
                    </Td>
                    <Td align="right" className="font-medium tabular-nums">{rs(o.total)}</Td>
                    <Td><PaymentStatusBadge status={o.payment_status} /></Td>
                    <Td><OrderStatusBadge status={o.status} /></Td>
                    <Td className="whitespace-nowrap text-muted-foreground">{fmtDate(o.created_at)}</Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/orders/${o.id}`} className={buttonClass({ size: "sm" })}>
                          View
                        </Link>
                        {canDeleteOrder(o) && (
                          <DeleteButton
                            title="Delete this order?"
                            description={deleteOrderDescription(o.order_number, o.status)}
                            confirmLabel="Delete order"
                            fallbackError="Couldn't delete the order. Check your connection and try again."
                            action={deleteOrder.bind(null, o.id, false)}
                          />
                        )}
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </TableShell>
        )}
      </BulkSelect>

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
