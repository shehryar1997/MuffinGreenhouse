// Pure helpers for choosing which product photo and price to show. Every photo belongs to a variant (there are no
// general photos), so a shopper only ever sees the photo of the exact size or pot they are looking at. Kept free
// of React and Supabase so the rules can be tested on their own.
import type { Product, ProductImage } from "@/types"

const bySortOrder = (a: ProductImage, b: ProductImage) => a.sortOrder - b.sortOrder

/** Photos grouped by the variant they belong to, each list by sort order. Photos with no variant are ignored. */
export function groupImagesByVariant(images: ProductImage[]): Map<string, ProductImage[]> {
  const byVariant = new Map<string, ProductImage[]>()
  for (const image of [...images].sort(bySortOrder)) {
    if (!image.variantId) continue
    const list = byVariant.get(image.variantId) ?? []
    list.push(image)
    byVariant.set(image.variantId, list)
  }
  return byVariant
}

/**
 * Which variant's photo the shop card (and everything else that shows one photo per product) uses: the variant
 * the admin ticked, when it is still offered and has a photo; otherwise the cheapest variant that has a photo;
 * otherwise the cheapest variant. null when there are no variants.
 */
export function chooseCardVariantId(
  variants: { id: string; price: number }[],
  hasPhoto: (variantId: string) => boolean,
  preferredId: string | null | undefined
): string | null {
  if (variants.length === 0) return null
  const preferred = preferredId ? variants.find((v) => v.id === preferredId) : undefined
  if (preferred && hasPhoto(preferred.id)) return preferred.id
  const cheapest = (list: { id: string; price: number }[]) => list.reduce((best, v) => (v.price < best.price ? v : best))
  const withPhoto = variants.filter((v) => hasPhoto(v.id))
  return cheapest(withPhoto.length > 0 ? withPhoto : variants).id
}

// Prices a shopper can actually pay: sizes in stock, or every size when all are sold out.
function buyablePrices(product: Pick<Product, "variants">): number[] {
  const inStock = product.variants.filter((variant) => variant.stockStatus !== "out_of_stock")
  return (inStock.length > 0 ? inStock : product.variants).map((variant) => variant.price)
}

/**
 * The lowest price among the sizes in stock, or null when the price doesn't vary and should be shown plain
 * (no variants, exactly one, or every size in stock costs the same).
 */
export function startingFromPrice(product: Pick<Product, "variants">): number | null {
  const prices = buyablePrices(product)
  if (prices.length <= 1) return null
  const min = Math.min(...prices)
  return prices.every((price) => price === min) ? null : min
}

/** The price to show on a card: the lowest in-stock size price when there are variants, else the product price. */
export function displayPrice(product: Pick<Product, "variants" | "price">): number {
  const prices = buyablePrices(product)
  return prices.length > 0 ? Math.min(...prices) : product.price
}

/**
 * The product page gallery for the selected variant: only that variant's own photos, so switching size never
 * shows another size's plant. The main photo is the one the shopper chose if it belongs to this variant, else the
 * variant's first photo. A variant with no photo yields no main image (the page shows its placeholder).
 */
export function pickGallery(
  selectedVariant: { images?: ProductImage[] } | null,
  shownImageId: string | null
): { galleryImages: ProductImage[]; mainImage: ProductImage | undefined } {
  const galleryImages = selectedVariant?.images ?? []
  return { galleryImages, mainImage: galleryImages.find((image) => image.id === shownImageId) ?? galleryImages[0] }
}

/**
 * Why a product can't be published yet, or null when it can: it needs at least one variant, and every variant
 * needs a photo (so no page can fall back to another size's picture). `name` is only used in the message.
 */
export function publishBlocker(variants: { name: string; hasPhoto: boolean }[]): string | null {
  if (variants.length === 0) return "Add at least one variant."
  const missing = variants.filter((v) => !v.hasPhoto).map((v) => v.name.trim() || "Unnamed variant")
  if (missing.length === 0) return null
  if (variants.length === 1) return "Add a photo."
  return `Add a photo for ${missing.join(", ")}. Every variant needs its own photo.`
}
