// What a product listing is still missing before it can sell well: the admin products list shows these as hints
// and the "Needs attention" tab / dashboard count use them. Pure, so it can be tested on its own.
import { isNonPlantCategoryName } from "@/lib/product-categories"

export type ReadinessInput = {
  category_name: string | null
  description: string | null
  short_description: string | null
  meta_description: string | null
  light: string | null
  water: string | null
  humidity: string | null
  temperature: string | null
  use_case_tags: string[] | null
  weight_kg: number | null
  /** Active variants, and whether each has its own photo. */
  variants: { name: string; hasPhoto: boolean }[]
}

export type ReadinessIssue = { key: string; label: string; blocking: boolean }

/** Roughly 40 words: enough for a useful description (the SEO plan asks for 200-300). */
export const MIN_DESCRIPTION_CHARS = 220

export function readinessIssues(p: ReadinessInput): ReadinessIssue[] {
  const issues: ReadinessIssue[] = []
  const isPlant = !isNonPlantCategoryName(p.category_name)

  if (p.variants.length === 0) issues.push({ key: "variants", label: "No sizes", blocking: true })
  const missingPhotos = p.variants.filter((v) => !v.hasPhoto).length
  if (missingPhotos > 0) issues.push({ key: "photos", label: missingPhotos === 1 && p.variants.length === 1 ? "No photo" : `${missingPhotos} sizes without a photo`, blocking: true })
  if (!isPlant && !(p.weight_kg && p.weight_kg > 0)) issues.push({ key: "weight", label: "No weight", blocking: true })

  if ((p.description ?? "").trim().length < MIN_DESCRIPTION_CHARS) issues.push({ key: "description", label: "Short description", blocking: false })
  if (!(p.short_description ?? "").trim()) issues.push({ key: "summary", label: "No one-line summary", blocking: false })
  if (!(p.meta_description ?? "").trim()) issues.push({ key: "seo", label: "No search text", blocking: false })
  if (isPlant) {
    const care = [p.light, p.water, p.humidity, p.temperature].filter((v) => (v ?? "").trim()).length
    if (care < 2) issues.push({ key: "care", label: "Care notes missing", blocking: false })
    if ((p.use_case_tags ?? []).length === 0) issues.push({ key: "tags", label: "No use-case tags", blocking: false })
  }
  return issues
}

/** The columns readinessIssues needs, as one Supabase select (products with their sizes and photo links). */
export const READINESS_SELECT =
  "category_name, description, short_description, meta_description, light, water, humidity, temperature, use_case_tags, weight_kg, variants:product_variants(id, name, is_active), images:product_images(variant_id)"

type ReadinessRow = Omit<ReadinessInput, "variants"> & {
  variants: { id: string; name: string; is_active: boolean | null }[] | null
  images: { variant_id: string | null }[] | null
}

export function toReadinessInput(row: ReadinessRow): ReadinessInput {
  const withPhoto = new Set((row.images ?? []).map((i) => i.variant_id).filter(Boolean))
  return {
    ...row,
    variants: (row.variants ?? []).filter((v) => v.is_active !== false).map((v) => ({ name: v.name, hasPhoto: withPhoto.has(v.id) })),
  }
}
