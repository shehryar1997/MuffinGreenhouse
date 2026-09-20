import Link from "next/link"
import { Search, Star } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { sanitizeSearchTerm } from "@/lib/search-term"
import { DeleteCustomerButton } from "./delete-customer-button"
import { deleteCustomer } from "./actions"
import { Alert, Badge, ButtonLink, EmptyState, PageHeader, StatStrip, TableShell, Td, Th, Thead, Tr, buttonClass, inputClass, linkClass, rowLinkClass } from "../_components/ui"
import { fmtDate, fmtNumber, plural, rs } from "../_components/format"

// Force fresh data on every load — admin pages should never show a
// customer's stale phone/address/etc. after they've just updated it.
export const dynamic = "force-dynamic"

// Customers who have spent MORE than this on the website are highlighted in the list.
const HIGH_SPENDER_THRESHOLD_PKR = 25000

interface AdminCustomersPageProps {
  searchParams: Promise<{ q?: string }>
}

interface CustomerRow {
  id: string
  email: string
  phone: string | null
  name: string | null
  auth_id: string | null
  email_verified: boolean | null
  created_at: string | null
  orders: Array<{ total: number | null; status: string; payment_status: string }> | null
}

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const { q } = await searchParams
  const query = sanitizeSearchTerm(q).toLowerCase()

  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("id, email, phone, name, auth_id, email_verified, created_at, orders:orders(total, status, payment_status)")
    .order("created_at", { ascending: false })

  if (error) {
    return (
      <>
        <PageHeader title="Customers" />
        <Alert tone="danger" title="Couldn't load customers">
          {error.message}
        </Alert>
      </>
    )
  }

  // Lifetime spend = money actually received: paid orders that weren't cancelled afterwards.
  const allCustomers = ((data ?? []) as unknown as CustomerRow[]).map((c) => {
    const orders = c.orders ?? []
    const spent = orders
      .filter((o) => o.payment_status === "paid" && o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total ?? 0), 0)
    return { ...c, orderCount: orders.length, spent, isHighSpender: spent > HIGH_SPENDER_THRESHOLD_PKR }
  })

  // ---- Summary (over everyone, regardless of the search box) ----
  const signedUpCount = allCustomers.filter((c) => c.auth_id).length
  const guestCount = allCustomers.length - signedUpCount
  const highSpenderCount = allCustomers.filter((c) => c.isHighSpender).length

  const customerData = query
    ? allCustomers.filter(
        (c) =>
          (c.name ?? "").toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          (c.phone ?? "").toLowerCase().includes(query)
      )
    : allCustomers

  return (
    <div>
      <PageHeader
        title="Customers"
        description={query ? `${plural(customerData.length, "match", "matches")} for “${query}”` : `${plural(allCustomers.length, "customer")}`}
      />

      <StatStrip
        items={[
          { label: "Signed up", value: fmtNumber(signedUpCount), hint: "Created an account on the website" },
          { label: "Guests", value: fmtNumber(guestCount), hint: "Ordered without an account" },
          { label: `Spent over ${rs(HIGH_SPENDER_THRESHOLD_PKR)}`, value: fmtNumber(highSpenderCount), hint: "Marked in the list below" },
        ]}
      />

      <form className="mt-6 flex gap-2" action="/admin/customers" method="GET" role="search">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            name="q"
            aria-label="Search customers"
            placeholder="Search by name, email or phone"
            defaultValue={query}
            className={`${inputClass} pl-9`}
          />
        </div>
        <button type="submit" className={buttonClass()}>
          Search
        </button>
        {query && (
          <Link href="/admin/customers" className={`${linkClass} inline-flex items-center px-2 text-[13px]`}>
            Clear
          </Link>
        )}
      </form>

      <div className="mt-4">
        {customerData.length === 0 ? (
          <EmptyState title="No customers found" description={query ? "Try a different name, email or phone number." : "Customers appear here after their first order."} />
        ) : (
          <TableShell minWidth="min-w-[860px]">
            <Thead>
              <tr>
                <Th>Customer</Th>
                <Th>Phone</Th>
                <Th>Account</Th>
                <Th>Joined</Th>
                <Th align="right">Orders</Th>
                <Th align="right">Spent</Th>
                <Th />
              </tr>
            </Thead>
            <tbody>
              {customerData.map((c) => (
                <Tr key={c.id} className={c.isHighSpender ? "bg-amber-50/60 hover:bg-amber-50" : undefined}>
                  <Td>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Link href={`/admin/customers/${c.id}`} className={rowLinkClass}>
                        {c.name || "Unnamed"}
                      </Link>
                      {c.isHighSpender && (
                        <Badge tone="warning" dot={false}>
                          <Star className="h-3 w-3 fill-current" aria-hidden />
                          Top spender
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">{c.email}</p>
                  </Td>
                  <Td className="whitespace-nowrap text-foreground/80">{c.phone || "—"}</Td>
                  <Td>
                    {c.auth_id ? (
                      <Badge tone="success">{c.email_verified ? "Signed up · verified" : "Signed up"}</Badge>
                    ) : (
                      <Badge>Guest</Badge>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{fmtDate(c.created_at)}</Td>
                  <Td align="right" className="tabular-nums">{c.orderCount}</Td>
                  <Td align="right" className={`tabular-nums ${c.isHighSpender ? "font-semibold" : ""}`}>{rs(c.spent)}</Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-2">
                      <ButtonLink href={`/admin/customers/${c.id}`} size="sm">
                        View
                      </ButtonLink>
                      <DeleteCustomerButton
                        email={c.email}
                        orderCount={c.orderCount}
                        action={deleteCustomer.bind(null, c.id)}
                        label="Delete"
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </div>
    </div>
  )
}
