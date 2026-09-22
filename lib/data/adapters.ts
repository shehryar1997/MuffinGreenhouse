import { Product, Category, ProductImage, ProductVariant, CareInfo } from '@/types'
import { SupabaseProduct, SupabaseProductImage, SupabaseProductVariant } from '@/supabase/client'
import { isNonPlantCategorySlug, isNonPlantCategoryName } from '@/lib/product-categories'
import { isWithinNewArrivalWindow } from '@/lib/new-arrival'
import { splitProductImages } from '@/lib/product-photos'

/**
 * Maps a SupabaseProduct (snake_case) to the app's Product type (camelCase)
 * ponytail: care info, category, and tags are now flat columns directly on
 * the products row (no joins) -- mirrors the Airtable Products table 1:1.
 */
export function mapSupabaseProductToProduct(row: SupabaseProduct): Product {
  // Tools & Equipment (pots, fertilizer, media...) have no use-case tags: the admin form
  // never saves them, and this also hides any left over from before that rule existed.
  const isToolOrEquipment = isNonPlantCategorySlug(row.category_slug) || isNonPlantCategoryName(row.category_name)
  // `images` holds the general photos (primary first) so every card and page that reads images[0] gets the
  // general primary photo. Variant-specific photos hang off their variant. A product whose only photos are
  // variant-specific falls back to all of them rather than showing nothing.
  const allImages = (row.images ?? []).map(mapSupabaseImage)
  const { general, byVariant } = splitProductImages(allImages)
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
    images: general.length > 0 ? general : allImages,
    careInfo: mapSupabaseCareInfo(row),
    // Retired variants (is_active = false) are never offered for sale.
    variants: (row.variants ?? [])
      .filter((v) => v.is_active !== false)
      .map((v) => mapSupabaseVariant(v, byVariant.get(v.id) ?? [])),
    useCaseTags: isToolOrEquipment ? [] : row.use_case_tags ?? [],
    // The "New" badge lasts 14 days from publishing, even if the flag hasn't been cleared yet.
    isNewArrival: !!row.is_new_arrival && isWithinNewArrivalWindow(row.published_at, row.created_at),
    isPetSafe: row.is_pet_safe,
    isImported: !!row.is_imported,
    difficulty: row.difficulty,
    lightRequirement: row.light_requirement,
    waterRequirement: row.water_requirement,
    size: row.size,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    // Shipping box dimensions
    boxHeightCm: row.box_height_cm ?? undefined,
    boxWidthCm: row.box_width_cm ?? undefined,
    boxBreadthCm: row.box_breadth_cm ?? undefined,
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
    variantId: img.variant_id ?? null,
    isPrimary: !!img.is_primary,
  }
}

function mapSupabaseVariant(variant: SupabaseProductVariant, images: ProductImage[]): ProductVariant {
  return {
    id: variant.id,
    name: variant.name,
    price: variant.price,
    stockStatus: variant.stock_status as 'in_stock' | 'low_stock' | 'out_of_stock',
    stockCount: variant.stock_count,
    sku: variant.sku,
    images,
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
