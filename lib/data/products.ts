// Product data access layer - Supabase backed
import { Product } from "@/types"
import { supabase } from "@/supabase/client"
import { mapSupabaseProductToProduct } from "./adapters"
import { chooseCardVariantId } from "@/lib/product-photos"
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
// pet_safe_note, category_name, category_slug,
// use_case_tags) -- no more joins needed for those. Only images
// and variants remain separate linked tables, same as in Airtable.

export const PRODUCT_SELECT = `
  *,
  images:product_images(id, url, alt_text, sort_order, is_primary, variant_id),
  variants:product_variants(id, sku, name, price, compare_at_price, stock_status, stock_count, is_default, is_active)
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
  /** Absent = "Recommended": featured first, then the admin's shop order, then newest. */
  sort?: 'featured' | 'new' | 'price-asc' | 'price-desc' | 'name'
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
    // "In stock" includes sizes that are running low: rare plants usually have only a few.
    query = query.neq("stock_status", "out_of_stock")
  }

  // Sold-out products always sink to the end, whatever the chosen order.
  query = query.order("is_sold_out", { ascending: true })
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
      query = query.order("published_at", { ascending: false })
      break
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("sort_position", { ascending: true, nullsFirst: false })
        .order("published_at", { ascending: false })
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
    // "In stock" includes sizes that are running low: rare plants usually have only a few.
    query = query.neq("stock_status", "out_of_stock")
  }

  // Sold-out products always sink to the end, whatever the chosen order.
  query = query.order("is_sold_out", { ascending: true })
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
      query = query.order("published_at", { ascending: false })
      break
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("sort_position", { ascending: true, nullsFirst: false })
        .order("published_at", { ascending: false })
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
    .order("is_sold_out", { ascending: true })
    .order("is_featured", { ascending: false })
    .order("sort_position", { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: false })
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



/**
 * What the homepage shows: in-stock products first, featured ones pinned to the front, then the admin's shop order,
 * then newest. Capped so the homepage stays light however large the catalogue grows.
 */
export async function getHomepageProducts(limit = 12): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .not("published_at", "is", null)
    .order("is_sold_out", { ascending: true })
    .order("is_featured", { ascending: false })
    .order("sort_position", { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: false })
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })
    .limit(limit)

  if (error) {
    console.error("Error fetching homepage products:", error)
    return []
  }
  return (data ?? []).map((row) => mapSupabaseProductToProduct(row as unknown as SupabaseProduct))
}

/** In-stock supplies (pots, planting media, fertilizer) offered as add-ons on a plant's page. */
export async function getAddOnProducts(excludeIds: string[], limit = 3): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .not("published_at", "is", null)
    .in("category_slug", ["pots", "planting-media", "fertilizer"])
    .neq("stock_status", "out_of_stock")
    .order("is_featured", { ascending: false })
    .order("sort_position", { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: false })
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })
    .limit(limit + excludeIds.length)

  if (error) {
    console.error("Error fetching add-on products:", error)
    return []
  }
  return (data ?? [])
    .map((row) => mapSupabaseProductToProduct(row as unknown as SupabaseProduct))
    .filter((p) => !excludeIds.includes(p.id) && p.images.length > 0)
    .slice(0, limit)
}

// ============================================================================
// Search Functions (using PostgreSQL full-text search)
// ============================================================================

export interface SearchProductsParams {
  query?: string
  categorySlug?: string
  useCaseSlugs?: string[]
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

  // Call the search_products SQL function. Its deployed parameter names are all
  // `p_`-prefixed (confirmed against the live DB: migrations/008_functions.sql in the
  // repo is stale and does not match what's actually deployed) -- calling with the
  // unprefixed names silently fails with PGRST202 and every search returns nothing.
  const { data, error } = await supabase.rpc('search_products', {
    p_search_query: query || null,
    p_category_slug: categorySlug || null,
    p_use_case_slugs: useCaseSlugs?.length ? useCaseSlugs : null,
    p_light_levels: lightLevels?.length ? lightLevels : null,
    p_difficulties: difficulties?.length ? difficulties : null,
    p_min_price: minPrice || null,
    p_max_price: maxPrice || null,
    p_is_pet_safe: isPetSafe ?? null,
    p_is_new_arrival: isNewArrival ?? null,
    p_sort_by: sortBy,
    p_page_size: pageSize,
    p_page_offset: (page - 1) * pageSize,
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
 * Used by search drawer when typing. `totalCount` is the full match count from the
 * SQL function (not just the 6 rows returned), so the drawer's "See all N results"
 * button can show the real number instead of capping at the suggestion list length.
 */
export async function searchProductsSuggestions(query: string): Promise<{
  results: Array<{
    id: string
    name: string
    slug: string
    price: number
    primary_image: string | null
  }>
  totalCount: number
}> {
  if (!query || query.length < 2) {
    return { results: [], totalCount: 0 }
  }

  const { data, error } = await supabase.rpc('search_products', {
    p_search_query: query,
    p_category_slug: null,
    p_use_case_slugs: null,
    p_light_levels: null,
    p_difficulties: null,
    p_min_price: null,
    p_max_price: null,
    p_is_pet_safe: null,
    p_is_new_arrival: null,
    p_sort_by: 'relevance',
    p_page_size: 6,
    p_page_offset: 0,
  })

  if (error) {
    console.error('Error searching suggestions:', error)
    return { results: [], totalCount: 0 }
  }

  // Map to minimal shape for suggestions
  interface SuggestionRow {
    id: string
    name: string
    slug: string
    price: number
    primary_image: string | null
    total_count: number
    [key: string]: unknown
  }
  const rows = (data ?? []) as SuggestionRow[]
  return {
    results: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      price: row.price,
      primary_image: row.primary_image,
    })),
    totalCount: rows[0]?.total_count ?? 0,
  }
}

/**
 * Minimal rows for the header search drawer's instant, typo-tolerant matching: loaded once, the first time the
 * drawer opens (not on every page), and small enough to stay light with hundreds of products.
 */
export async function getSearchIndex(): Promise<
  Array<{ id: string; name: string; slug: string; price: number; category_name: string; primary_image: string | null }>
> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, price, category_name, card_variant_id, images:product_images(url, variant_id, sort_order), variants:product_variants(id, price, is_active)")
    .not("published_at", "is", null)
    .order("is_sold_out", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("Error loading the search index:", error)
    return []
  }
  type Row = {
    id: string
    name: string
    slug: string
    price: number
    category_name: string | null
    card_variant_id: string | null
    images: { url: string; variant_id: string | null; sort_order: number | null }[] | null
    variants: { id: string; price: number; is_active: boolean | null }[] | null
  }
  return ((data ?? []) as unknown as Row[]).map((row) => {
    const active = (row.variants ?? []).filter((v) => v.is_active !== false)
    const photoOf = (variantId: string) =>
      (row.images ?? []).filter((i) => i.variant_id === variantId).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url ?? null
    const cardId = chooseCardVariantId(active, (id) => photoOf(id) !== null, row.card_variant_id)
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      price: row.price,
      category_name: row.category_name ?? "",
      primary_image: cardId ? photoOf(cardId) : null,
    }
  })
}
