import Link from "next/link"
import { Search } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"

// Force fresh data on every load — same class of stale-admin-data bug
// found on the customers/orders pages, fixed here too for consistency.
export const dynamic = "force-dynamic"

interface AdminProductsPageProps {
  searchParams: { q?: string }
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const query = searchParams.q?.trim().toLowerCase() || ""

  let productsQuery = supabaseAdmin
    .from("products")
    .select("id, sku, name, category_name, price, stock_count, stock_status, published_at")
    .order("name")

  // Server-side filter if search query exists
  if (query) {
    productsQuery = productsQuery.or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
  }

  const { data: products, error } = await productsQuery

  if (error) {
    return <p className="text-red-600">Error loading products: {error.message}</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">Products ({products?.length ?? 0})</h1>
        <Link
          href="/admin/products/new"
          className="bg-[#E85D2C] text-white rounded px-4 py-2 text-sm font-medium"
        >
          + Add product
        </Link>
      </div>

      {/* Search Bar */}
      <form className="mb-6" action="/admin/products" method="GET">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="search"
            name="q"
            placeholder="Search by name or SKU..."
            defaultValue={query}
            className="w-full h-10 pl-10 pr-4 rounded-md border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2C] focus:ring-offset-1"
          />
          {query && (
            <Link
              href="/admin/products"
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
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">{p.category_name}</td>
                <td className="px-4 py-3">Rs {p.price}</td>
                <td className="px-4 py-3">
                  {p.stock_count} ({p.stock_status})
                </td>
                <td className="px-4 py-3">{p.published_at ? "Published" : "Draft"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${p.id}/edit`} className="text-[#E85D2C] hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
