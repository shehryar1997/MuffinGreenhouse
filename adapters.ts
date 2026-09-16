import { Product, Category, ProductImage, ProductVariant, CareInfo } from '@/types'
import { SupabaseProduct, SupabaseProductImage, SupabaseProductVariant } from '@/supabase/client'

/**
 * Maps a SupabaseProduct (snake_case) to the app's Product type (camelCase)
 * ponytail: care info, category, and tags are now flat columns directly on
 * the products row (no joins) -- mirrors the Airtable Products table 1:1.
 */
export function mapSupabaseProductToProduct(row: SupabaseProduct): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: mapSupabaseCategory(row),
    description: row.description,
    price: row.price,
    compareAtPrice: row.compare_at_price ?? undefined,
    currency: row.currency,
    stockStatus: row.stock_status,
    stockCount: row.stock_count,
    images: (row.images ?? []).map(mapSupabaseImage),
    careInfo: mapSupabaseCareInfo(row),
    variants: (row.variants ?? []).map(mapSupabaseVariant),
    useCaseTags: row.use_case_tags ?? [],
    isNewArrival: row.is_new_arrival,
    isPetSafe: row.is_pet_safe,
    difficulty: row.difficulty,
    lightRequirement: row.light_requirement,
    waterRequirement: row.water_requirement,
    size: row.size,
    moodTags: row.mood_tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  }
}

function mapSupabaseCategory(row: SupabaseProduct): Category {
  return {
    id: row.category_id,
    slug: row.category_slug ?? '',
    name: row.category_name ?? '',
    description: undefined,
    image: undefined,
    parentId: undefined,
    sortOrder: 0,
    isActive: true,
  }
}

function mapSupabaseImage(img: SupabaseProductImage): ProductImage {
  return {
    id: img.id,
    url: img.url,
    alt: img.alt_text,
    sortOrder: img.sort_order,
  }
}

function mapSupabaseVariant(variant: SupabaseProductVariant): ProductVariant {
  return {
    id: variant.id,
    name: variant.name,
    price: variant.price,
    stockStatus: variant.stock_status as 'in_stock' | 'low_stock' | 'out_of_stock',
    stockCount: variant.stock_count,
    sku: variant.sku,
  }
}

function mapSupabaseCareInfo(row: SupabaseProduct): CareInfo {
  return {
    light: row.light ?? '',
    water: row.water ?? '',
    humidity: row.humidity ?? '',
    temperature: row.temperature ?? '',
    soil: row.soil ?? '',
    fertilizer: row.fertilizer ?? '',
    toxicity: row.toxicity ?? '',
  }
}
