import Link from "next/link"
import { Search } from "lucide-react"

// Force fresh data on every load — admin pages should never show a
// customer's stale phone/address/etc. after they've just updated it.
export const dynamic = "force-dynamic"
import { supabaseAdmin } from "@/supabase/admin-client"

interface AdminCustomersPageProps {
  searchParams: { q?: string }
}

// ============================================================================
// TEMPORARY DIAGNOSTIC — remove this whole function and its call below once
// the stale/missing-customer-data bug is confirmed fixed. Decodes the JWT
// payload of whatever key admin-client.ts is actually using (WITHOUT
// verifying its signature — this is read-only introspection, never trust
// this for auth) so we can see, right on the page, whether production is
// really using the service_role key or something else, and whether it's
// even pointed at the project we think it is.
// ============================================================================
function decodeJwtPayload(token: string | undefined): Record<string, unknown> | null {
  if (!token) return null
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4)
    const json = Buffer.from(padded, "base64").toString("utf8")
    return JSON.parse(json)
  } catch {
    return null
  }
}

async function DiagnosticPanel() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "(unset)"
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const claims = decodeJwtPayload(key)

  const { count, error: countError } = await supabaseAdmin
    .from("customers")
    .select("*", { count: "exact", head: true })

  const { data: rawRows, error: rawError } = await supabaseAdmin
    .from("customers")
    .select("id, email, name, phone")
    .order("created_at", { ascending: false })

  return (
    <div className="mb-6 p-4 rounded-lg border-2 border-red-400 bg-red-50 text-xs font-mono space-y-1 whitespace-pre-wrap break-all">
      <p className="font-bold text-red-700 mb-2">TEMPORARY DIAGNOSTIC — remove after debugging</p>
      <p>NEXT_PUBLIC_SUPABASE_URL: {url}</p>
      <p>SUPABASE_SERVICE_ROLE_KEY present: {key ? `yes (length ${key.length})` : "NO — missing env var"}</p>
      <p>Decoded key role claim: {claims ? String(claims.role ?? "(no role claim)") : "(could not decode — check key format)"}</p>
      <p>Decoded key project ref (iss/ref): {claims ? String((claims as any).ref ?? (claims as any).iss ?? "(none)") : "(n/a)"}</p>
      <p>Server time (UTC): {new Date().toISOString()}</p>
      <p>Exact count() query: {countError ? `ERROR: ${countError.message}` : `${count} row(s)`}</p>
      <p>
        Raw select (no joins) rows returned: {rawError ? `ERROR: ${rawError.message}` : rawRows?.length ?? 0}
      </p>
      <p>Raw rows: {JSON.stringify(rawRows ?? rawError ?? null)}</p>
    </div>
  )
}
// ============================================================================
// END TEMPORARY DIAGNOSTIC
// ============================================================================

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
      {/* TEMPORARY — see DiagnosticPanel above */}
      {/* @ts-expect-error Async Server Component */}
      <DiagnosticPanel />

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
