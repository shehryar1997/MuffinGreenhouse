import Link from "next/link"
import { Search } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { sanitizeSearchTerm } from "@/lib/search-term"
import { isNonPlantCategoryName } from "@/lib/product-categories"
import { DeleteProductButton } from "./delete-product-button"
import { deleteProduct } from "./actions"

// Force fresh data on every load — same class of stale-admin-data bug
// found on the customers/orders pages, fixed here too for consistency.
export const dynamic = "force-dynamic"

type StockFilter = "out_of_stock" | "unpublished" | "published"
const FILTERS: StockFilter[] = ["out_of_stock", "unpublished", "published"]

interface AdminProductsPageProps {
  searchParams: Promise<{ q?: string; filter?: string; category?: string }>
}

interface ProductRow {
  id: string
  sku: string
  name: string
  category_name: string | null
  price: number
  stock_count: number | null
  stock_status: string | null
  published_at: string | null
  weight_kg: number | null
}

function listHref(params: { q?: string; filter?: string; category?: string }): string {
  const search = new URLSearchParams()
  if (params.q) search.set("q", params.q)
  if (params.filter) search.set("filter", params.filter)
  if (params.category) search.set("category", params.category)
  const qs = search.toString()
  return qs ? `/admin/products?${qs}` : "/admin/products"
}

function SummaryCard({
  label,
  value,
  href,
  active,
  tone = "default",
}: {
  label: string
  value: number
  href?: string
  active?: boolean
  tone?: "default" | "warn" | "danger"
}) {
  const toneClass = tone === "danger" ? "text-red-600" : tone === "warn" ? "text-amber-600" : "text-neutral-900"
  const body = (
    <>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${toneClass}`}>{value}</p>
    </>
  )
  const base = "rounded-lg border bg-white p-4 block"
  if (!href) return <div className={base}>{body}</div>
  return (
    <Link
      href={href}
      className={`${base} hover:border-[#E85D2C] ${active ? "border-[#E85D2C] ring-1 ring-[#E85D2C]" : ""}`}
    >
      {body}
    </Link>
  )
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const { q, filter: rawFilter, category: rawCategory } = await searchParams
  const query = sanitizeSearchTerm(q).toLowerCase()
  const filter = FILTERS.find((f) => f === rawFilter)
  const categoryFilter = rawCategory?.slice(0, 80) || undefined

  const [{ data, error }, { data: categoryRows }] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select("id, sku, name, category_name, price, stock_count, stock_status, published_at, weight_kg")
      .order("name"),
    supabaseAdmin.from("categories").select("name").order("sort_order"),
  ])

  if (error) {
    return <p className="text-red-600">Error loading products: {error.message}</p>
  }

  const allProducts = (data ?? []) as ProductRow[]

  // ---- Summary (always over the whole catalogue, whatever filter is active) ----
  const publishedCount = allProducts.filter((p) => p.published_at).length
  const unpublishedCount = allProducts.length - publishedCount
  const outOfStockCount = allProducts.filter((p) => p.stock_status === "out_of_stock").length
  // Tools & Equipment are delivered at 120 PKR/kg, so a missing weight means under-charged delivery.
  const missingWeightCount = allProducts.filter(
    (p) => isNonPlantCategoryName(p.category_name) && !(p.weight_kg && p.weight_kg > 0)
  ).length

  const categoryNames = (categoryRows ?? []).map((c) => c.name as string)
  for (const p of allProducts) {
    if (p.category_name && !categoryNames.includes(p.category_name)) categoryNames.push(p.category_name)
  }
  const publishedByCategory = new Map<string, number>()
  for (const p of allProducts) {
    if (p.published_at && p.category_name) {
      publishedByCategory.set(p.category_name, (publishedByCategory.get(p.category_name) ?? 0) + 1)
    }
  }

  // ---- Filtered list ----
  const products = allProducts.filter((p) => {
    if (query && !(p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query))) return false
    if (filter === "out_of_stock" && p.stock_status !== "out_of_stock") return false
    if (filter === "unpublished" && p.published_at) return false
    if (filter === "published" && !p.published_at) return false
    if (categoryFilter && p.category_name !== categoryFilter) return false
    return true
  })
  const filtersActive = !!(filter || categoryFilter || query)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">
          Products ({products.length}
          {filtersActive ? ` of ${allProducts.length}` : ""})
        </h1>
        <Link href="/admin/products/new" className="bg-[#E85D2C] text-white rounded px-4 py-2 text-sm font-medium">
          + Add product
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <SummaryCard label="Total in database" value={allProducts.length} href={listHref({})} active={!filter && !categoryFilter} />
        <SummaryCard label="Published on website" value={publishedCount} href={listHref({ filter: "published" })} active={filter === "published"} />
        <SummaryCard
          label="In database, not published"
          value={unpublishedCount}
          href={listHref({ filter: "unpublished" })}
          active={filter === "unpublished"}
          tone={unpublishedCount > 0 ? "warn" : "default"}
        />
        <SummaryCard
          label="Out of stock"
          value={outOfStockCount}
          href={listHref({ filter: "out_of_stock" })}
          active={filter === "out_of_stock"}
          tone={outOfStockCount > 0 ? "danger" : "default"}
        />
      </div>

      <div className="bg-white rounded-lg border p-4 mb-6">
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Published on the website, by category</p>
        <div className="flex flex-wrap gap-2">
          {categoryNames.map((name) => {
            const count = publishedByCategory.get(name) ?? 0
            const active = categoryFilter === name
            return (
              <Link
                key={name}
                href={listHref({ category: active ? undefined : name })}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:border-[#E85D2C] ${
                  active ? "border-[#E85D2C] bg-orange-50" : "bg-white"
                }`}
              >
                {name}
                <span className={`font-semibold ${count === 0 ? "text-neutral-400" : "text-neutral-900"}`}>{count}</span>
              </Link>
            )
          })}
        </div>
        {missingWeightCount > 0 && (
          <p className="mt-3 text-xs text-amber-700">
            {missingWeightCount} Tools &amp; Equipment product{missingWeightCount > 1 ? "s have" : " has"} no weight recorded — delivery
            for {missingWeightCount > 1 ? "them" : "it"} is estimated at 1 kg per unit until you add one (look for “Add weight” below).
          </p>
        )}
      </div>

      {/* Search Bar */}
      <form className="mb-6" action="/admin/products" method="GET">
        {filter && <input type="hidden" name="filter" value={filter} />}
        {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="search"
            name="q"
            placeholder="Search by name or SKU..."
            defaultValue={query}
            className="w-full h-10 pl-10 pr-4 rounded-md border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2C] focus:ring-offset-1"
          />
        </div>
      </form>
      {filtersActive && (
        <p className="mb-4 text-sm text-neutral-600">
          Showing
          {filter ? ` ${filter.replace("_", " ")}` : ""}
          {categoryFilter ? ` in ${categoryFilter}` : ""}
          {query ? ` matching “${query}”` : ""} ·{" "}
          <Link href="/admin/products" className="text-[#E85D2C] hover:underline">
            Clear filters
          </Link>
        </p>
      )}

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
            {products.map((p) => {
              const needsWeight = isNonPlantCategoryName(p.category_name) && !(p.weight_kg && p.weight_kg > 0)
              return (
                <tr key={p.id} className="border-t align-top">
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3">
                    {p.category_name}
                    {needsWeight && (
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                      >
                        Add weight
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3">Rs {p.price}</td>
                  <td className="px-4 py-3">
                    {p.stock_count} ({p.stock_status})
                  </td>
                  <td className="px-4 py-3">{p.published_at ? "Published" : "Draft"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-start justify-end gap-4">
                      <Link href={`/admin/products/${p.id}/edit`} className="text-[#E85D2C] hover:underline">
                        Edit
                      </Link>
                      <DeleteProductButton productName={p.name} action={deleteProduct.bind(null, p.id)} label="Delete" />
                    </div>
                  </td>
                </tr>
              )
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  {filtersActive ? "No products match these filters." : "No products yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
