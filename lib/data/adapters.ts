import { Product, Category, ProductImage, ProductVariant, CareInfo } from '@/types'
import { SupabaseProduct, SupabaseProductImage, SupabaseProductVariant, SupabaseCareInfo } from '@/supabase/client'

/**
 * Maps a SupabaseProduct (snake_case) to the app's Product type (camelCase)
 * ponytail: Assumes category data is populated via Supabase join
 */
export function mapSupabaseProductToProduct(row: SupabaseProduct): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: mapSupabaseCategory(row.category!, row.category_id),
    description: row.description,
    price: row.price,
    compareAtPrice: row.compare_at_price ?? undefined,
    currency: row.currency,
    stockStatus: row.stock_status,
    stockCount: row.stock_count,
    images: (row.images ?? []).map(mapSupabaseImage),
    careInfo: mapSupabaseCareInfo(row.care_info),
    variants: (row.variants ?? []).map(mapSupabaseVariant),
    useCaseTags: row.use_cases ?? [],
    isNewArrival: row.is_new_arrival,
    isPetSafe: row.is_pet_safe,
    difficulty: row.difficulty,
    lightRequirement: row.light_requirement,
    waterRequirement: row.water_requirement,
    size: row.size,
    moodTags: row.moods ?? [],
    createdAt: row.created_at,
    updatedAt: row.created_at, // ponytail: No updated_at in SupabaseProduct, using created_at
  }
}

function mapSupabaseCategory(category: { id: string; name: string; slug: string }, categoryId: string): Category {
  return {
    id: category?.id ?? categoryId,
    slug: category?.slug ?? '',
    name: category?.name ?? '',
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

function mapSupabaseCareInfo(careInfo: SupabaseCareInfo | undefined): CareInfo {
  return {
    light: careInfo?.light ?? '',
    water: careInfo?.water ?? '',
    humidity: careInfo?.humidity ?? '',
    temperature: careInfo?.temperature ?? '',
    soil: careInfo?.soil ?? '',
    fertilizer: careInfo?.fertilizer ?? '',
    toxicity: careInfo?.toxicity ?? '',
  }
}
