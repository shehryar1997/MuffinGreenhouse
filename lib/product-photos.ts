// Pure helpers for choosing which product photo and price to show. A photo with no variant_id is
// "general" and applies to every variant; a photo with a variant_id only applies while that variant
// is selected. Kept free of React and Supabase so the rules can be tested on their own.
import type { Product, ProductImage } from "@/types"

const bySortOrder = (a: ProductImage, b: ProductImage) => a.sortOrder - b.sortOrder

export type SplitImages = {
  /** General photos: the primary one first, then the rest by sort order. */
  general: ProductImage[]
  /** Variant-specific photos keyed by variant id, each list by sort order. */
  byVariant: Map<string, ProductImage[]>
}

export function splitProductImages(images: ProductImage[]): SplitImages {
  const sorted = [...images].sort(bySortOrder)
  const byVariant = new Map<string, ProductImage[]>()
  const generalRaw: ProductImage[] = []
  for (const image of sorted) {
    if (!image.variantId) {
      generalRaw.push(image)
      continue
    }
    const list = byVariant.get(image.variantId) ?? []
    list.push(image)
    byVariant.set(image.variantId, list)
  }
  // The card and the product page start on the general primary photo. With no primary flagged, the
  // lowest sort order (already first) wins.
  const primary = generalRaw.find((image) => image.isPrimary)
  const general = primary ? [primary, ...generalRaw.filter((image) => image !== primary)] : generalRaw
  return { general, byVariant }
}

/**
 * The lowest active variant price, or null when the price doesn't vary and should be shown plain
 * (no variants, exactly one variant, or every variant costs the same).
 */
export function startingFromPrice(product: Pick<Product, "variants">): number | null {
  const prices = product.variants.map((variant) => variant.price)
  if (prices.length <= 1) return null
  const min = Math.min(...prices)
  return prices.every((price) => price === min) ? null : min
}

/** The price to show on a card: the lowest variant price when there are variants, else the product price. */
export function displayPrice(product: Pick<Product, "variants" | "price">): number {
  const prices = product.variants.map((variant) => variant.price)
  return prices.length > 0 ? Math.min(...prices) : product.price
}

/**
 * Keeps "exactly one primary among general photos" true in the admin form before anything is saved:
 * variant photos are never primary, at most one general photo is (the first one flagged wins), and when
 * there are general photos but none is flagged the first one becomes primary.
 */
export function normalizePrimary<T extends { variant_key: number | null; is_primary: boolean }>(rows: T[]): T[] {
  const isGeneral = (row: T) => row.variant_key === null
  const chosen = rows.find((row) => isGeneral(row) && row.is_primary) ?? rows.find(isGeneral)
  return rows.map((row) => {
    const primary = row === chosen
    return row.is_primary === primary ? row : { ...row, is_primary: primary }
  })
}

/**
 * Server-side twin of normalizePrimary: the url that gets is_primary = true on save. It is the first
 * general photo flagged primary, else the first general photo, else none. Decided again on the server so
 * a crafted or older request cannot leave two primaries.
 */
export function choosePrimaryUrl(photos: { url: string; variant_id: string | null; flagged: boolean }[]): string | null {
  const general = photos.filter((photo) => photo.variant_id === null)
  return (general.find((photo) => photo.flagged) ?? general[0])?.url ?? null
}

/**
 * The product page gallery. General photos come first (a product with only variant photos falls back to
 * its whole list), then the selected variant's own photos. The main photo is the one the shopper chose if
 * it is still in the gallery, else the general primary photo, so it never goes blank when a variant
 * without its own photos is picked.
 */
export function pickGallery(
  product: Pick<Product, "images">,
  selectedVariant: { images?: ProductImage[] } | null,
  shownImageId: string | null
): { galleryImages: ProductImage[]; mainImage: ProductImage | undefined } {
  const general = product.images.filter((image) => !image.variantId)
  const base = general.length > 0 ? general : product.images
  const own = (selectedVariant?.images ?? []).filter((image) => !base.some((b) => b.id === image.id))
  const galleryImages = [...base, ...own]
  return { galleryImages, mainImage: galleryImages.find((image) => image.id === shownImageId) ?? base[0] }
}
