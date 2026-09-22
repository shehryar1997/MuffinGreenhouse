import { sanitizeSearchTerm } from "@/lib/search-term"

// The filters of the admin products list (?q=, ?filter=, ?category=). Shared by the list page and the CSV export,
// so "Export" always contains exactly the products the list is showing.

export const PRODUCT_FILTERS = ["out_of_stock", "low_stock", "attention", "unpublished", "published"] as const
export type ProductFilter = (typeof PRODUCT_FILTERS)[number]

export type ProductFilters = { query: string; filter?: ProductFilter; category?: string }

export function parseProductFilters(params: { q?: string | null; filter?: string | null; category?: string | null }): ProductFilters {
  return {
    query: sanitizeSearchTerm(params.q).toLowerCase(),
    filter: PRODUCT_FILTERS.find((f) => f === params.filter),
    category: params.category?.slice(0, 80) || undefined,
  }
}

export function matchesProductFilters(
  p: { name: string; sku: string; category_name: string | null; stock_status: string | null; published_at: string | null; needsAttention?: boolean },
  { query, filter, category }: ProductFilters
): boolean {
  if (query && !p.name.toLowerCase().includes(query) && !p.sku.toLowerCase().includes(query)) return false
  if (filter === "out_of_stock" && p.stock_status !== "out_of_stock") return false
  if (filter === "low_stock" && p.stock_status !== "low_stock") return false
  if (filter === "attention" && !p.needsAttention) return false
  if (filter === "unpublished" && p.published_at) return false
  if (filter === "published" && !p.published_at) return false
  if (category && p.category_name !== category) return false
  return true
}
