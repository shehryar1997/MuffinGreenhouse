// Product data access layer - Supabase backed
import { Product } from "@/types"
import { supabase } from "@/supabase/client"
import { mapSupabaseProductToProduct } from "./adapters"
import { SupabaseProduct } from "@/supabase/client"

// Re-export static category/use-case display config (not product data)
export { shopByNeedIcons, useCases, categoryMeta } from "@/data/mock-products"

// ============================================================================
// Supabase Query Configuration
// ============================================================================
// NOTE: care info, category, and tags now live directly as flat columns on
// `products` (light, water, humidity, temperature, soil, fertilizer, toxicity,
// light_summary, water_summary, pet_safe_note, category_name, category_slug,
// use_case_tags, mood_tags) -- no more joins needed for those. Only images
// and variants remain separate linked tables, same as in Airtable.

const PRODUCT_SELECT = `
  *,
  images:product_images(id, url, alt_text, sort_order, is_primary),
  variants:product_variants(id, sku, name, price, stock_status, stock_count, is_default)
`

// ============================================================================
// Product Fetching Functions
// ============================================================================

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .not("published_at", "is", null)
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })

  if (error) {
    console.error("Error fetching all products:", error)
    return []
  }

  return (data ?? []).map((row) => mapSupabaseProductToProduct(row as unknown as SupabaseProduct))
}

// ============================================================================
// Paginated Product Fetching (shop/all + category grids)
// ============================================================================
// Used by the grid pages instead of getAllProducts/getProductsByCategory so
// the catalog can grow without ever pulling every row per request. Page size
// mirrors what the grid pages render per page (see PRODUCTS_PER_PAGE).

export const PRODUCTS_PER_PAGE = 24

export interface PaginatedProducts {
  products: Product[]
  totalCount: number
}

export async function getPaginatedProducts(page: number, pageSize: number = PRODUCTS_PER_PAGE): Promise<PaginatedProducts> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .not("published_at", "is", null)
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })
    .range(from, to)

  if (error) {
    console.error("Error fetching paginated products:", error)
    return { products: [], totalCount: 0 }
  }

  return {
    products: (data ?? []).map((row) => mapSupabaseProductToProduct(row as unknown as SupabaseProduct)),
    totalCount: count ?? 0,
  }
}

export async function getPaginatedProductsByCategory(categorySlug: string, page: number, pageSize: number = PRODUCTS_PER_PAGE): Promise<PaginatedProducts> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("category_slug", categorySlug)
    .not("published_at", "is", null)
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })
    .range(from, to)

  if (error) {
    console.error("Error fetching paginated products by category:", error)
    return { products: [], totalCount: 0 }
  }

  return {
    products: (data ?? []).map((row) => mapSupabaseProductToProduct(row as unknown as SupabaseProduct)),
    totalCount: count ?? 0,
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .not("published_at", "is", null)
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })
    .maybeSingle()

  if (error) {
    console.error("Error fetching product by slug:", error)
    return undefined
  }

  if (!data) {
    return undefined
  }

  return mapSupabaseProductToProduct(data as unknown as SupabaseProduct)
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("category_slug", categorySlug)
    .not("published_at", "is", null)
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })

  if (error) {
    console.error("Error fetching products by category:", error)
    return []
  }

  return (data ?? []).map((row) => mapSupabaseProductToProduct(row as unknown as SupabaseProduct))
}

// use_case_tags is now a flat text[] of tag NAMES on products (e.g. "Beginner-Proof"),
// matching Airtable's multi-select choices exactly. Routing still uses slugs, so this
// fixed mapping (same 6 values as the Airtable "Use Case Tags" field) converts between
// them -- deliberately not derived by string transformation, since names like
// "Balcony & Rooftop" and "Air-Purifying" don't reconstruct cleanly from a slug.
const USE_CASE_SLUG_TO_LABEL: Record<string, string> = {
  "low-light-survivors": "Low-Light Survivors",
  "balcony-rooftop": "Balcony & Rooftop",
  "air-purifying": "Air-Purifying",
  "pet-safe": "Pet-Safe",
  "beginner-proof": "Beginner-Proof",
  "statement-plants": "Statement Plants",
}

export async function getProductsByUseCase(useCaseSlug: string): Promise<Product[]> {
  const label = USE_CASE_SLUG_TO_LABEL[useCaseSlug] ?? useCaseSlug

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .contains("use_case_tags", [label])
    .not("published_at", "is", null)
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })

  if (error) {
    console.error("Error fetching products by use case:", error)
    return []
  }

  return (data ?? []).map((row) => mapSupabaseProductToProduct(row as unknown as SupabaseProduct))
}

export async function getWeeklySoldCount(): Promise<number> {
  // ponytail: Returning 0 as required -- no order data exists yet.
  // Real order counting should NOT be fabricated. Implement when orders table is ready.
  return 0
}

export async function getPlantOfTheDay(): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_featured", true)
    .not("published_at", "is", null)
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("Error fetching plant of the day:", error)
  }

  if (data) {
    return mapSupabaseProductToProduct(data as unknown as SupabaseProduct)
  }

  // Fallback: get first published product
  const { data: fallback, error: fallbackError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .not("published_at", "is", null)
    .order("created_at", { ascending: true })
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })
    .limit(1)
    .maybeSingle()

  if (fallbackError || !fallback) {
    console.error("Error fetching fallback plant of the day:", fallbackError)
    throw new Error("No products available")
  }

  return mapSupabaseProductToProduct(fallback as unknown as SupabaseProduct)
}
