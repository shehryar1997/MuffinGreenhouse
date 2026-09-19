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

// ============================================================================
// Search Functions (using PostgreSQL full-text search)
// ============================================================================

export interface SearchProductsParams {
  query?: string
  categorySlug?: string
  useCaseSlugs?: string[]
  moodSlugs?: string[]
  lightLevels?: ('low' | 'medium' | 'bright' | 'full_sun')[]
  difficulties?: ('beginner' | 'intermediate' | 'expert')[]
  minPrice?: number
  maxPrice?: number
  isPetSafe?: boolean
  isNewArrival?: boolean
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name'
  page?: number
  pageSize?: number
}

export async function searchProducts(params: SearchProductsParams): Promise<PaginatedProducts> {
  const {
    query = '',
    categorySlug,
    useCaseSlugs,
    moodSlugs,
    lightLevels,
    difficulties,
    minPrice,
    maxPrice,
    isPetSafe,
    isNewArrival,
    sortBy = 'relevance',
    page = 1,
    pageSize = PRODUCTS_PER_PAGE,
  } = params

  // Call the search_products SQL function
  const { data, error } = await supabase.rpc('search_products', {
    search_query: query || null,
    category_slug: categorySlug || null,
    use_case_slugs: useCaseSlugs?.length ? useCaseSlugs : null,
    mood_slugs: moodSlugs?.length ? moodSlugs : null,
    light_levels: lightLevels?.length ? lightLevels : null,
    difficulties: difficulties?.length ? difficulties : null,
    min_price: minPrice || null,
    max_price: maxPrice || null,
    is_pet_safe: isPetSafe ?? null,
    is_new_arrival: isNewArrival ?? null,
    sort_by: sortBy,
    page_size: pageSize,
    page_offset: (page - 1) * pageSize,
  })

  if (error) {
    console.error('Error searching products:', error)
    return { products: [], totalCount: 0 }
  }

  if (!data || data.length === 0) {
    return { products: [], totalCount: 0 }
  }

  // Extract product IDs from search results
  interface SearchResultRow {
    id: string
    total_count?: number
    [key: string]: unknown
  }
  const productIds = data.map((row: SearchResultRow) => row.id)
  const totalCount = data[0]?.total_count ?? 0

  // Fetch full product data for these IDs
  const { data: fullProducts, error: fetchError } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .in('id', productIds)
    .not('published_at', 'is', null)
    .order('sort_order', { foreignTable: 'product_images', ascending: true })
    .order('sort_order', { foreignTable: 'product_variants', ascending: true })

  if (fetchError) {
    console.error('Error fetching searched products:', fetchError)
    return { products: [], totalCount: 0 }
  }

  // Map to Product type
  const products = (fullProducts ?? []).map((row) =>
    mapSupabaseProductToProduct(row as unknown as SupabaseProduct)
  )

  return { products, totalCount }
}

/**
 * Lightweight search for suggestions (returns minimal fields).
 * Used by search drawer when typing.
 */
export async function searchProductsSuggestions(query: string): Promise<Array<{
  id: string
  name: string
  slug: string
  price: number
  primary_image: string | null
}>> {
  if (!query || query.length < 2) {
    return []
  }

  const { data, error } = await supabase.rpc('search_products', {
    search_query: query,
    category_slug: null,
    use_case_slugs: null,
    mood_slugs: null,
    light_levels: null,
    difficulties: null,
    min_price: null,
    max_price: null,
    is_pet_safe: null,
    is_new_arrival: null,
    sort_by: 'relevance',
    page_size: 6,
    page_offset: 0,
  })

  if (error) {
    console.error('Error searching suggestions:', error)
    return []
  }

  // Map to minimal shape for suggestions
  interface SuggestionRow {
    id: string
    name: string
    slug: string
    price: number
    primary_image: string | null
    [key: string]: unknown
  }
  return (data ?? []).map((row: SuggestionRow) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: row.price,
    primary_image: row.primary_image,
  }))
}
