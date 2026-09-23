import { Product, Category, ProductImage, ProductVariant, CareInfo } from '@/types'
import { SupabaseProduct, SupabaseProductImage, SupabaseProductVariant } from '@/supabase/client'
import { isNonPlantCategorySlug, isNonPlantCategoryName } from '@/lib/product-categories'
import { isWithinNewArrivalWindow } from '@/lib/new-arrival'
import { chooseCardVariantId, groupImagesByVariant } from '@/lib/product-photos'

/**
 * Maps a SupabaseProduct (snake_case) to the app's Product type (camelCase)
 * ponytail: care info, category, and tags are now flat columns directly on
 * the products row (no joins) -- mirrors the Airtable Products table 1:1.
 */
export function mapSupabaseProductToProduct(row: SupabaseProduct): Product {
  // Tools & Equipment (pots, fertilizer, media...) have no use-case tags: the admin form
  // never saves them, and this also hides any left over from before that rule existed.
  const isToolOrEquipment = isNonPlantCategorySlug(row.category_slug) || isNonPlantCategoryName(row.category_name)
  // Every photo belongs to a variant. `images` holds the photos of the card variant (the one the admin ticked, else
  // the cheapest with a photo), so every card and page that reads images[0] gets the card photo; each variant
  // carries its own photos for the product page. A legacy product with no variants at all keeps showing its old
  // photos (it can't be published without a variant).
  // Retired variants (is_active = false) are never offered for sale.
  const activeVariants = (row.variants ?? []).filter((v) => v.is_active !== false)
  const variantNames = new Map((row.variants ?? []).map((v) => [v.id, v.name]))
  const allImages = (row.images ?? []).map((img) => mapSupabaseImage(img, row.name, variantNames))
  const byVariant = groupImagesByVariant(allImages)
  const cardVariantId = chooseCardVariantId(activeVariants, (id) => (byVariant.get(id)?.length ?? 0) > 0, row.card_variant_id)
  const cardPhotos = cardVariantId ? byVariant.get(cardVariantId) ?? [] : []
  const legacyPhotos =
    activeVariants.length === 0
      ? allImages
          .filter((img) => !img.variantId)
          .sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary) || a.sortOrder - b.sortOrder)
      : []
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: mapSupabaseCategory(row),
    description: row.description,
    shortDescription: row.short_description?.trim() || undefined,
    metaTitle: row.meta_title?.trim() || undefined,
    metaDescription: row.meta_description?.trim() || undefined,
    price: row.price,
    currency: row.currency,
    stockStatus: row.stock_status,
    stockCount: row.stock_count,
    images: cardPhotos.length > 0 ? cardPhotos : legacyPhotos,
    cardVariantId,
    careInfo: mapSupabaseCareInfo(row),
    variants: activeVariants.map((v) => mapSupabaseVariant(v, byVariant.get(v.id) ?? [])),
    useCaseTags: isToolOrEquipment ? [] : row.use_case_tags ?? [],
    // The "New" badge lasts 14 days from publishing, even if the flag hasn't been cleared yet.
    isNewArrival: !!row.is_new_arrival && isWithinNewArrivalWindow(row.published_at, row.created_at),
    isFeatured: !!row.is_featured,
    isPetSafe: row.is_pet_safe,
    isImported: !!row.is_imported,
    isHardLeaf: !!row.is_hard_leaf,
    difficulty: row.difficulty,
    lightRequirement: row.light_requirement,
    waterRequirement: row.water_requirement,
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

// Alt text describes the plant, not just the size: "Monstera Deliciosa, Medium 8\" pot" rather than "Medium".
// A custom alt text typed in the admin panel (anything other than the bare variant name) is kept as written.
export function productImageAlt(altText: string | null | undefined, productName: string, variantName: string | null | undefined): string {
  const alt = altText?.trim() ?? ""
  const size = variantName?.trim() ?? ""
  if (alt && alt !== size && alt.toLowerCase() !== "standard") return alt
  return size && size.toLowerCase() !== "standard" ? `${productName}, ${size}` : productName
}

function mapSupabaseImage(img: SupabaseProductImage, productName: string, variantNames: Map<string, string>): ProductImage {
  return {
    id: img.id,
    url: img.url,
    alt: productImageAlt(img.alt_text, productName, img.variant_id ? variantNames.get(img.variant_id) : null),
    sortOrder: img.sort_order,
    variantId: img.variant_id ?? null,
    isPrimary: !!img.is_primary,
  }
}

function mapSupabaseVariant(variant: SupabaseProductVariant, images: ProductImage[]): ProductVariant {
  const compareAt = variant.compare_at_price
  return {
    id: variant.id,
    name: variant.name,
    price: variant.price,
    compareAtPrice: compareAt && compareAt > variant.price ? compareAt : undefined,
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
