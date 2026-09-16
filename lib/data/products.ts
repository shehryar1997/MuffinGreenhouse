// Product data access layer - Supabase backed
import { Product } from "@/types"
import { supabase } from "@/supabase/client"
import { mapSupabaseProductToProduct } from "./adapters"
import { SupabaseProduct } from "@/supabase/client"

// Re-export static data and mock reviews (not product data)
export { mockProducts, shopByNeedIcons, useCases, categoryMeta, mockReviews } from "@/data/mock-products"

// ============================================================================
// Supabase Query Configuration
// ============================================================================

const PRODUCT_SELECT = `
  *,
  category:categories(id, name, slug),
  images:product_images(id, url, alt_text, sort_order, is_primary),
  variants:product_variants(id, sku, name, price, stock_status, stock_count, is_default),
  care_info(light, water, humidity, temperature, soil, fertilizer, toxicity),
  product_use_cases(use_case_tags(slug)),
  product_moods(mood_tags(slug))
`

interface RawSupabaseRow {
  id: string
  product_use_cases?: Array<{ use_case_tags: { slug: string } }>
  product_moods?: Array<{ mood_tags: { slug: string } }>
  care_info?: Array<Record<string, string>> | Record<string, string>
  [key: string]: unknown
}

function normalizeRow(row: RawSupabaseRow): SupabaseProduct {
  const use_cases = (row.product_use_cases ?? [])
    .map((puc) => puc.use_case_tags?.slug)
    .filter(Boolean) as string[]
  const moods = (row.product_moods ?? [])
    .map((pm) => pm.mood_tags?.slug)
    .filter(Boolean) as string[]
  const careInfo = (Array.isArray(row.care_info) ? row.care_info[0] : row.care_info) as
    | Record<string, string>
    | undefined
  return { ...row, use_cases, moods, care_info: careInfo } as SupabaseProduct
}


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

  return (data ?? []).map((row) => mapSupabaseProductToProduct(normalizeRow((row as unknown) as RawSupabaseRow)))
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

  return mapSupabaseProductToProduct(normalizeRow((data as unknown) as RawSupabaseRow))
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT.replace(
      "category:categories(id, name, slug)",
      "category:categories!inner(id, name, slug)"
    ))
    .eq("category.slug", categorySlug)
    .not("published_at", "is", null)
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })

  if (error) {
    console.error("Error fetching products by category:", error)
    return []
  }

  return (data ?? []).map((row) => mapSupabaseProductToProduct(normalizeRow((row as unknown) as RawSupabaseRow)))
}

export async function getProductsByUseCase(useCaseSlug: string): Promise<Product[]> {
  const { data: tagData, error: tagError } = await supabase
    .from("use_case_tags")
    .select("id")
    .eq("slug", useCaseSlug)
    .maybeSingle()

  if (tagError || !tagData) {
    if (tagError) console.error("Error fetching use case tag:", tagError)
    return []
  }

  const { data: links, error: linksError } = await supabase
    .from("product_use_cases")
    .select("product_id")
    .eq("use_case_id", tagData.id)

  if (linksError || !links?.length) {
    if (linksError) console.error("Error fetching product use case links:", linksError)
    return []
  }

  const productIds = links.map((l) => l.product_id)

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", productIds)
    .not("published_at", "is", null)
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })

  if (error) {
    console.error("Error fetching products by use case:", error)
    return []
  }

  return (data ?? []).map((row) => mapSupabaseProductToProduct(normalizeRow((row as unknown) as RawSupabaseRow)))
}

export async function getWeeklySoldCount(): Promise<number> {
  // ponytail: Returning 0 as required — no order data exists yet.
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
    return mapSupabaseProductToProduct(normalizeRow((data as unknown) as RawSupabaseRow))
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

  return mapSupabaseProductToProduct(normalizeRow((fallback as unknown) as RawSupabaseRow))
}
