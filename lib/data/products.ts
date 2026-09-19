// Product data access layer - Supabase backed
import { Product } from "@/types"
import { supabase } from "@/supabase/client"
import { mapSupabaseProductToProduct } from "./adapters"
import { SupabaseProduct } from "@/supabase/client"
import { isPlantProduct, NON_PLANT_CATEGORY_NAMES, NON_PLANT_CATEGORY_SLUGS } from "@/lib/product-categories"
import { MAX_PRICE } from "@/components/shop/product-filters"

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
  variants:product_variants(id, sku, name, price, stock_status, stock_count, is_default, is_active)
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

export interface FilterParams {
  light?: 'low' | 'medium' | 'bright' | 'full_sun'
  water?: 'low' | 'medium' | 'high'
  pets?: 'yes' | 'no'
  min?: number
  max?: number
  stock?: 'in'
  sort?: 'new' | 'price-asc' | 'price-desc' | 'name'
}

// PostgREST `not.in` drops NULL rows, so each filter also keeps rows with no category.
// Names are quoted because "Other Equipment" / "Planting Media" contain spaces.
const NOT_NON_PLANT_SLUG = `category_slug.is.null,category_slug.not.in.(${NON_PLANT_CATEGORY_SLUGS.join(",")})`
const NOT_NON_PLANT_NAME = `category_name.is.null,category_name.not.in.(${NON_PLANT_CATEGORY_NAMES.map((n) => `"${n}"`).join(",")})`

/** Plants only: "All Plants" excludes the Tools & Equipment categories (they have their own pages). */
export async function getPaginatedProducts(page: number, pageSize: number = PRODUCTS_PER_PAGE, filters?: FilterParams): Promise<PaginatedProducts> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .not("published_at", "is", null)
    .or(NOT_NON_PLANT_SLUG)
    .or(NOT_NON_PLANT_NAME)

  // Apply filters
  if (filters?.light) {
    query = query.eq("light_requirement", filters.light)
  }
  if (filters?.water) {
    query = query.eq("water_requirement", filters.water)
  }
  if (filters?.pets) {
    const isPetSafe = filters.pets === "yes"
    query = query.eq("is_pet_safe", isPetSafe)
  }
  if (filters?.min !== undefined) {
    query = query.gte("price", filters.min)
  }
  if (filters?.max !== undefined) {
    query = query.lte("price", filters.max)
  }
  if (filters?.stock === 'in') {
    query = query.eq("stock_status", "in_stock")
  }

  // Apply sorting
  switch (filters?.sort) {
    case 'price-asc':
      query = query.order("price", { ascending: true })
      break
    case 'price-desc':
      query = query.order("price", { ascending: false })
      break
    case 'name':
      query = query.order("name", { ascending: true })
      break
    case 'new':
    default:
      query = query.order("published_at", { ascending: false })
  }

  // Always order images/variants by sort_order
  query = query.order("sort_order", { foreignTable: "product_images", ascending: true })
  query = query.order("sort_order", { foreignTable: "product_variants", ascending: true })

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error("Error fetching paginated products:", error)
    return { products: [], totalCount: 0 }
  }

  return {
    products: (data ?? []).map((row) => mapSupabaseProductToProduct(row as unknown as SupabaseProduct)),
    totalCount: count ?? 0,
  }
}

export async function getPaginatedProductsByCategory(categorySlug: string, page: number, pageSize: number = PRODUCTS_PER_PAGE, filters?: FilterParams): Promise<PaginatedProducts> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("category_slug", categorySlug)
    .not("published_at", "is", null)

  // Apply filters
  if (filters?.light) {
    query = query.eq("light_requirement", filters.light)
  }
  if (filters?.water) {
    query = query.eq("water_requirement", filters.water)
  }
  if (filters?.pets) {
    const isPetSafe = filters.pets === "yes"
    query = query.eq("is_pet_safe", isPetSafe)
  }
  if (filters?.min !== undefined) {
    query = query.gte("price", filters.min)
  }
  if (filters?.max !== undefined) {
    query = query.lte("price", filters.max)
  }
  if (filters?.stock === 'in') {
    query = query.eq("stock_status", "in_stock")
  }

  // Apply sorting
  switch (filters?.sort) {
    case 'price-asc':
      query = query.order("price", { ascending: true })
      break
    case 'price-desc':
      query = query.order("price", { ascending: false })
      break
    case 'name':
      query = query.order("name", { ascending: true })
      break
    case 'new':
    default:
      query = query.order("published_at", { ascending: false })
  }

  // Always order images/variants by sort_order
  query = query.order("sort_order", { foreignTable: "product_images", ascending: true })
  query = query.order("sort_order", { foreignTable: "product_variants", ascending: true })

  const { data, error, count } = await query.range(from, to)

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

  // Use-case tags are a plant concept; never list Tools & Equipment here.
  return (data ?? []).map((row) => mapSupabaseProductToProduct(row as unknown as SupabaseProduct)).filter(isPlantProduct)
}

export async function getPriceBounds(): Promise<{ min: number; max: number }> {
  const { data, error } = await supabase
    .from("products")
    .select("price")
    .not("published_at", "is", null)
    .or(NOT_NON_PLANT_SLUG)
    .or(NOT_NON_PLANT_NAME)

  if (error || !data) {
    console.error("Error fetching price bounds:", error)
    return { min: 0, max: MAX_PRICE }
  }

  const prices = data.map(row => row.price).filter(price => price > 0)
  if (prices.length === 0) return { min: 0, max: MAX_PRICE }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  }
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
