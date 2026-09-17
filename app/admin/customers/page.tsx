import Link from "next/link"
import { Search } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"

interface AdminCustomersPageProps {
  searchParams: { q?: string }
}

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const query = searchParams.q?.trim().toLowerCase() || ""

  // Fetch customers with order count
  let customersQuery = supabaseAdmin
    .from("customers")
    .select("id, email, phone, name, email_verified, created_at, orders:orders(count)")
    .order("created_at", { ascending: false })

  // Server-side filter if search query exists
  if (query) {
    customersQuery = customersQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
  }

  const { data: customers, error } = await customersQuery

  if (error) {
    return <p className="text-red-600">Error loading customers: {error.message}</p>
  }

  // Transform data to extract order count from the nested count
  const customerData = (customers ?? []).map((c) => ({
    ...c,
    orderCount: (c.orders as unknown as [{ count: number }])?.[0]?.count ?? 0,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">Customers ({customerData.length ?? 0})</h1>
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
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Signup Date</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {customerData.map((c) => (
              <tr key={c.id} className="border-t hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium">{c.name || "—"}</td>
                <td className="px-4 py-3">{c.email}</td>
                <td className="px-4 py-3">{c.phone || "—"}</td>
                <td className="px-4 py-3">
                  {c.email_verified ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                      Unverified
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">{c.orderCount}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/customers/${c.id}`} className="text-[#E85D2C] hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {customerData.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
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
