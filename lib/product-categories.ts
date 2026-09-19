// Tools & Equipment categories: products that aren't living plants, so plant care
// data (light, water, humidity, temperature, difficulty, pet safety...) doesn't
// apply. The admin form hides those fields for these categories, the save action
// clears them, and the storefront never shows or filters on them.
//
// Keep names and slugs in sync with the `categories` table. Pure and dependency-free,
// so it's safe to import from server code, client components and the admin form.

export const NON_PLANT_CATEGORY_NAMES = ["Fertilizer", "Other Equipment", "Pots", "Planting Media"] as const
export const NON_PLANT_CATEGORY_SLUGS = ["fertilizer", "other-equipment", "pots", "planting-media"] as const

const namesLower: readonly string[] = NON_PLANT_CATEGORY_NAMES.map((n) => n.toLowerCase())
const slugsLower: readonly string[] = NON_PLANT_CATEGORY_SLUGS

export function isNonPlantCategoryName(name: string | null | undefined): boolean {
  return !!name && namesLower.includes(name.trim().toLowerCase())
}

export function isNonPlantCategorySlug(slug: string | null | undefined): boolean {
  return !!slug && slugsLower.includes(slug.trim().toLowerCase())
}

/** False for products in a Tools & Equipment category (matched by slug or name). */
export function isPlantProduct(product: { category: { name?: string | null; slug?: string | null } }): boolean {
  return !(isNonPlantCategorySlug(product.category.slug) || isNonPlantCategoryName(product.category.name))
}
