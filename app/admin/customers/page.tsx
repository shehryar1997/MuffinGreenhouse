import Link from "next/link"
import { Search } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { sanitizeSearchTerm } from "@/lib/search-term"
import { DeleteCustomerButton } from "./delete-customer-button"
import { deleteCustomer } from "./actions"

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

const rs = (n: number) => `Rs ${n.toLocaleString("en-PK")}`

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const { q } = await searchParams
  const query = sanitizeSearchTerm(q).toLowerCase()

  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("id, email, phone, name, auth_id, email_verified, created_at, orders:orders(total, status, payment_status)")
    .order("created_at", { ascending: false })

  if (error) {
    return <p className="text-red-600">Error loading customers: {error.message}</p>
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">Customers ({customerData.length})</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Signed-up clients</p>
          <p className="text-2xl font-semibold mt-1">{signedUpCount}</p>
          <p className="text-[11px] text-neutral-500 mt-1">Unique accounts created on the website</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Guest customers</p>
          <p className="text-2xl font-semibold mt-1">{guestCount}</p>
          <p className="text-[11px] text-neutral-500 mt-1">Ordered without creating an account</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-800">Spent over {rs(HIGH_SPENDER_THRESHOLD_PKR)}</p>
          <p className="text-2xl font-semibold mt-1 text-amber-900">{highSpenderCount}</p>
          <p className="text-[11px] text-amber-800/80 mt-1">Highlighted in the list below</p>
        </div>
      </div>

      {/* Search Bar */}
      <form className="mb-6" action="/admin/customers" method="GET">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="search"
            name="q"
            placeholder="Search by name, email, or phone..."
            defaultValue={query}
            className="w-full h-10 pl-10 pr-4 rounded-md border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2C] focus:ring-offset-1"
          />
          {query && (
            <Link
              href="/admin/customers"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-sm"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="bg-white rounded-lg border overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Signup Date</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total spent</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {customerData.map((c) => (
              <tr key={c.id} className={`border-t align-top ${c.isHighSpender ? "bg-amber-50 hover:bg-amber-100/70" : "hover:bg-neutral-50"}`}>
                <td className="px-4 py-3 font-medium">
                  {c.name || "-"}
                  {c.isHighSpender && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                      ★ Top spender
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{c.email}</td>
                <td className="px-4 py-3">{c.phone || "-"}</td>
                <td className="px-4 py-3">
                  {c.auth_id ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {c.email_verified ? "Signed up · verified" : "Signed up"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                      Guest
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">{c.orderCount}</td>
                <td className={`px-4 py-3 ${c.isHighSpender ? "font-semibold text-amber-900" : ""}`}>{rs(c.spent)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-start justify-end gap-4">
                    <Link href={`/admin/customers/${c.id}`} className="text-[#E85D2C] hover:underline">
                      View
                    </Link>
                    <DeleteCustomerButton
                      email={c.email}
                      orderCount={c.orderCount}
                      action={deleteCustomer.bind(null, c.id)}
                      label="Delete"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {customerData.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
