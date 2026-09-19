import Link from "next/link"
import { Search, Plus, Package, AlertCircle, Eye, EyeOff } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { sanitizeSearchTerm } from "@/lib/search-term"
import { isNonPlantCategoryName } from "@/lib/product-categories"
import { DeleteProductButton } from "./delete-product-button"
import { deleteProduct } from "./actions"

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

type StatusType = "success" | "warning" | "danger" | "default" | "info"

function StatusBadge({ children, status }: { children: React.ReactNode; status?: StatusType }) {
  const styles: Record<StatusType, string> = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    default: "bg-slate-50 text-slate-600 border-slate-200",
  }
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[status || "default"]}`}>
      {children}
    </span>
  )
}

function SummaryCard({
  label,
  value,
  href,
  active,
  status = "default",
  icon: Icon,
}: {
  label: string
  value: number
  href?: string
  active?: boolean
  status?: StatusType
  icon?: React.ElementType
}) {
  const statusColors: Record<StatusType, string> = {
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-500",
    info: "text-sky-600",
    default: "text-neutral-900",
  }
  
  const activeBorder = active ? "ring-2 ring-[#E85D2C] bg-[#E85D2C]/5" : "border border-neutral-200"
  
  const content = (
    <div className={`p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-200 ${activeBorder}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${statusColors[status]}`}>{value}</p>
        </div>
        {Icon && (
          <div className={`p-2 rounded-xl ${status === "danger" ? "bg-red-50" : status === "warning" ? "bg-amber-50" : "bg-emerald-50"}`}>
            <Icon className={`h-5 w-5 ${status === "danger" ? "text-red-500" : status === "warning" ? "text-amber-500" : "text-emerald-500"}`} />
          </div>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }
  return content
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Error loading products</p>
          <p className="text-neutral-500 text-sm mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  const allProducts = (data ?? []) as ProductRow[]

  const publishedCount = allProducts.filter((p) => p.published_at).length
  const unpublishedCount = allProducts.length - publishedCount
  const outOfStockCount = allProducts.filter((p) => p.stock_status === "out_of_stock").length

  const categories = (categoryRows ?? [] as { name: string }[]).map((r) => r.name)
  const needsWeight = allProducts.filter(
    (p) => isNonPlantCategoryName(p.category_name) && !(p.weight_kg && p.weight_kg > 0)
  ).length

  let products = allProducts
  if (query) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query)
    )
  }
  if (filter === "out_of_stock") {
    products = products.filter((p) => p.stock_status === "out_of_stock")
  } else if (filter === "unpublished") {
    products = products.filter((p) => !p.published_at)
  } else if (filter === "published") {
    products = products.filter((p) => p.published_at)
  }
  if (categoryFilter) {
    products = products.filter((p) => p.category_name === categoryFilter)
  }

  const uniqueCategories = [...new Set(categories)]
  const filtersActive = filter || query || categoryFilter
  const listHref = (params: { q?: string; filter?: string; category?: string }) => {
    const search = new URLSearchParams()
    if (params.q) search.set("q", params.q)
    if (params.filter) search.set("filter", params.filter)
    if (params.category) search.set("category", params.category)
    const qs = search.toString()
    return qs ? `/admin/products?${qs}` : "/admin/products"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900">Products</h1>
          <p className="text-neutral-500 mt-1">Manage your store catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E85D2C] text-white rounded-xl font-medium text-sm hover:bg-[#d45124] transition-colors shadow-lg shadow-orange-500/25"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Products"
          value={allProducts.length}
          href={listHref({ q: query })}
          active={!filter && !categoryFilter}
          status="info"
          icon={Package}
        />
        <SummaryCard
          label="Published"
          value={publishedCount}
          href={listHref({ q: query, filter: "published" })}
          active={filter === "published"}
          status="success"
          icon={Eye}
        />
        <SummaryCard
          label="Draft"
          value={unpublishedCount}
          href={listHref({ q: query, filter: "unpublished" })}
          active={filter === "unpublished"}
          status="warning"
          icon={EyeOff}
        />
        <SummaryCard
          label="Out of Stock"
          value={outOfStockCount}
          href={listHref({ q: query, filter: "out_of_stock" })}
          active={filter === "out_of_stock"}
          status={needsWeight > 0 ? "danger" : "default"}
          icon={AlertCircle}
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="search"
              name="q"
              placeholder="Search by name or SKU..."
              defaultValue={query}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2C]/20 focus:bg-white transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              name="category"
              defaultValue={categoryFilter || ""}
              className="h-11 px-4 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2C]/20"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button type="submit" className="px-5 h-11 bg-neutral-900 text-white rounded-xl font-medium text-sm hover:bg-neutral-800 transition-colors">
              Filter
            </button>
          </div>
        </form>

        {filtersActive && (
          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
            <span>Showing:</span>
            {filter && <span className="px-2 py-1 rounded-lg bg-neutral-100">{filter.replace("_", " ")}</span>}
            {categoryFilter && <span className="px-2 py-1 rounded-lg bg-neutral-100">{categoryFilter}</span>}
            {query && <span className="px-2 py-1 rounded-lg bg-neutral-100">matching "{query}"</span>}
            <Link href="/admin/products" className="text-[#E85D2C] hover:underline ml-auto">
              Clear all
            </Link>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50/80 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((p) => {
                const needsWeightFlag = isNonPlantCategoryName(p.category_name) && !(p.weight_kg && p.weight_kg > 0)
                const isLowStock = p.stock_count !== null && p.stock_count > 0 && p.stock_count <= 5
                
                return (
                  <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 flex items-center justify-center text-neutral-400 group-hover:from-[#E85D2C]/10 group-hover:to-[#E85D2C]/5 group-hover:text-[#E85D2C] transition-all">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{p.name}</p>
                          <p className="text-xs text-neutral-400 font-mono">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-600">{p.category_name}</span>
                      {needsWeightFlag && (
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium hover:bg-amber-200 transition-colors"
                        >
                          <AlertCircle className="h-3 w-3" />
                          Add weight
                        </Link>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-neutral-900">Rs {p.price.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      {isLowStock ? (
                        <StatusBadge status="warning">
                          {p.stock_count} left
                        </StatusBadge>
                      ) : p.stock_count === 0 ? (
                        <StatusBadge status="danger">
                          Out of stock
                        </StatusBadge>
                      ) : (
                        <span className="text-sm text-neutral-600">{p.stock_count} in stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.published_at ? (
                        <StatusBadge status="success">
                          <Eye className="h-3 w-3" />
                          Published
                        </StatusBadge>
                      ) : (
                        <StatusBadge status="default">
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </StatusBadge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/admin/products/${p.id}/edit`}
                          className="px-3 py-1.5 text-sm font-medium text-[#E85D2C] hover:bg-[#E85D2C]/10 rounded-lg transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteProductButton productName={p.name} action={deleteProduct.bind(null, p.id)} label="Delete" />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="py-16 text-center">
            <Package className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 font-medium">
              {filtersActive ? "No products match these filters" : "No products yet"}
            </p>
            {!filtersActive && (
              <Link href="/admin/products/new" className="text-[#E85D2C] hover:underline mt-2 inline-block">
                Add your first product
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
