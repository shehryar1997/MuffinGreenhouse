// Whether a plant ships bare-root (pot sent separately) or potted (in its pot). Pure and dependency-free, so it's
// safe to import from server code, client components and the admin form.
//
// Aroids, Hoyas and Orchids always ship potted. Sansevierias, Agaves and Cacti & Succulents always ship bare-root:
// their leaves can snap if packed inside the pot for transit. They are tough, drought-tolerant plants and aren't
// stressed by bare-root shipping; the customer pots them in fresh planting media on arrival.
//
// Mangaves are mixed: only the hard-leaf ones need bare-root shipping, so that's a per-product flag
// (products.is_hard_leaf) rather than the whole category.
const ALWAYS_BARE_ROOT_CATEGORY_NAMES = ["Sansevierias", "Agaves", "Cacti & Succulents"] as const
const MANGAVES_CATEGORY_NAME = "Mangaves"

export function shipsBareRoot(product: { category: { name?: string | null }; isHardLeaf?: boolean }): boolean {
  const name = product.category.name
  if (!name) return false
  if ((ALWAYS_BARE_ROOT_CATEGORY_NAMES as readonly string[]).includes(name)) return true
  return name === MANGAVES_CATEGORY_NAME && !!product.isHardLeaf
}

/** Whether the "Hard leaf (ships bare-root)" toggle applies to this category, i.e. Mangaves. */
export function isMangaveCategory(categoryName: string | null | undefined): boolean {
  return (categoryName ?? "").trim() === MANGAVES_CATEGORY_NAME
}
