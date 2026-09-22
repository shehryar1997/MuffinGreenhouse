// CSV product import: maps spreadsheet columns onto the admin product form's fields and turns one row into the
// same FormData the form submits, so an imported product goes through exactly the same validation and save path
// as one typed into the form (see app/admin/products/actions.ts). Pure and dependency-free: used by the browser
// preview and by the server action.

import { isNonPlantCategoryName } from "@/lib/product-categories"
import { restoreFormula } from "@/lib/csv"

/** A CSV row keyed by canonical column name (see `canonicalColumn`). */
export type ImportRecord = Record<string, string>

export const MAX_IMPORT_ROWS = 500
export const IMPORT_VARIANT_SLOTS = 3

// Columns every file must contain. Slug is not listed: it is generated from the name when left blank.
export const REQUIRED_COLUMNS = ["name", "sku", "category_name", "description", "price"] as const

const SIMPLE_COLUMNS = [
  "name", "sku", "slug", "category_name", "short_description", "description",
  "price", "compare_at_price", "stock_count", "low_stock_threshold",
  "box_height_cm", "box_width_cm", "box_breadth_cm", "weight_kg",
  "difficulty", "light_requirement", "water_requirement", "size",
  "is_new_arrival", "is_pet_safe", "is_imported", "is_featured", "published",
  "use_case_tags", "light_summary", "water_summary", "light", "water", "humidity", "temperature",
  "soil", "fertilizer", "toxicity", "pet_safe_note", "meta_title", "meta_description",
] as const

/**
 * Every column, in form order, with the given number of variant slots. Photos belong to variants: each variant slot
 * has its own image_url, and image_url_1 is the photo of a product that has no variants (it is sold as a single
 * "Standard" variant).
 */
export function columnsFor(variantSlots: number): string[] {
  return [
    ...SIMPLE_COLUMNS,
    "image_url_1",
    ...Array.from({ length: variantSlots }, (_, i) => ["name", "sku", "price", "stock", "image_url"].map((f) => `variant_${i + 1}_${f}`)).flat(),
  ]
}

export const TEMPLATE_COLUMNS = columnsFor(IMPORT_VARIANT_SLOTS)

const simple = new Set<string>(SIMPLE_COLUMNS)

// Alternative headers people are likely to use (matched after normalising, see `normalizeHeader`).
const ALIASES: Record<string, string> = {
  product_name: "name", product: "name", title: "name",
  category: "category_name",
  price_pkr: "price", selling_price: "price",
  compare_at: "compare_at_price", compare_at_price_pkr: "compare_at_price", original_price: "compare_at_price",
  stock: "stock_count", quantity: "stock_count", qty: "stock_count",
  low_stock: "low_stock_threshold", low_stock_alert: "low_stock_threshold",
  weight: "weight_kg",
  box_height: "box_height_cm", box_width: "box_width_cm", box_breadth: "box_breadth_cm",
  new_arrival: "is_new_arrival", pet_safe: "is_pet_safe", imported: "is_imported", featured: "is_featured",
  publish: "published", is_published: "published",
  tags: "use_case_tags", use_case: "use_case_tags",
  seo_title: "meta_title", seo_description: "meta_description",
  short_desc: "short_description", full_description: "description",
}

function normalizeHeader(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

/** Maps a header cell to a canonical column name, or null if it isn't a product field. */
export function canonicalColumn(raw: string): string | null {
  const key = normalizeHeader(raw)
  if (!key) return null
  if (simple.has(key)) return key
  if (ALIASES[key]) return ALIASES[key]
  // Only one product-level photo exists now (the Standard variant's); older sheets with image_url_2.. or alt-text
  // columns are still understood, those columns are just ignored.
  const image = key.match(/^(?:image_url|image|photo_url|photo)(?:_(\d+))?$/)
  if (image) return !image[1] || Number(image[1]) === 1 ? "image_url_1" : null
  const variant = key.match(/^variant_(\d+)_(name|sku|price|stock|stock_count|image_url|image|photo_url|photo)$/)
  if (variant) {
    const field = variant[2] === "stock_count" ? "stock" : /^(image|photo)/.test(variant[2]) ? "image_url" : variant[2]
    return `variant_${Number(variant[1])}_${field}`
  }
  return null
}

export type HeaderMapping = {
  /** Canonical column for each header cell, in file order; null = not a product field (ignored). */
  columns: (string | null)[]
  /** Headers that were understood (raw text -> canonical name). */
  recognized: { header: string; column: string }[]
  /** Headers that were ignored. */
  ignored: string[]
  /** Required columns the file doesn't have. */
  missing: string[]
}

export function mapHeaders(headers: string[]): HeaderMapping {
  const seen = new Set<string>()
  const columns = headers.map((h) => {
    const c = canonicalColumn(h)
    if (!c || seen.has(c)) return null // a repeated column: the first one wins
    seen.add(c)
    return c
  })
  return {
    columns,
    recognized: headers.flatMap((header, i) => (columns[i] ? [{ header: header.trim(), column: columns[i] as string }] : [])),
    ignored: headers.filter((h, i) => !columns[i] && h.trim() !== "").map((h) => h.trim()),
    missing: REQUIRED_COLUMNS.filter((c) => !seen.has(c)),
  }
}

/** Builds a record for one data row. Cells beyond the header are dropped; missing ones are empty. */
export function rowToRecord(columns: (string | null)[], cells: string[]): ImportRecord {
  const record: ImportRecord = {}
  columns.forEach((column, i) => {
    if (column) record[column] = restoreFormula((cells[i] ?? "").trim())
  })
  return record
}

export const isBlankRecord = (record: ImportRecord) => Object.values(record).every((v) => v === "")

// Rows whose SKU starts with this are the examples shipped in the template: skipped on import.
export const EXAMPLE_SKU_PREFIX = "EXAMPLE-"
export const isExampleRecord = (record: ImportRecord) => (record.sku ?? "").toUpperCase().startsWith(EXAMPLE_SKU_PREFIX)

export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
}

/** The slug an imported row will get: the one in the sheet, or one generated from the name. */
export const recordSlug = (record: ImportRecord) => record.slug?.trim() || slugify(record.name ?? "")

const truthy = (v: string | undefined) => /^(y|yes|true|1|on|x)$/i.test((v ?? "").trim())

// "1,200" -> "1200". Only strips thousands separators, so "1,5" is left alone and rejected by validation.
function cleanNumber(v: string | undefined): string {
  const s = (v ?? "").trim().replace(/^(?:pkr|rs\.?)\s*/i, "")
  return /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s) ? s.replace(/,/g, "") : s
}

const matchIgnoringCase = (value: string, allowed: string[]) => allowed.find((a) => a.toLowerCase() === value.trim().toLowerCase())

// "Full sun" / "full-sun" / "FULL_SUN" -> "full_sun"; blank -> the form's default.
const enumValue = (v: string | undefined, fallback: string) => {
  const s = (v ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_")
  return s || fallback
}

export type ImportLookups = { categories: string[]; useCaseTags: string[] }

/**
 * Turns one row into the FormData the product form would submit. Returns an error message for anything that
 * can't be expressed as form input (unknown category or tag, a variant without a price...). Everything else
 * (required fields, ranges, formats) is left to the form's own validation, which runs on the result.
 */
export function recordToFormData(
  record: ImportRecord,
  lookups: ImportLookups
): { formData: FormData; variantSkus: string[] } | { error: string } {
  const get = (k: string) => (record[k] ?? "").trim()

  let category = get("category_name")
  if (category) {
    const match = matchIgnoringCase(category, lookups.categories)
    if (!match) return { error: `Unknown category “${category}”. Use one of: ${lookups.categories.join(", ")}.` }
    category = match
  }
  const isPlant = !isNonPlantCategoryName(category)

  const fd = new FormData()
  fd.set("category_name", category)
  for (const k of [
    "name", "sku", "description", "short_description", "meta_title", "meta_description",
    "light_summary", "water_summary", "light", "water", "humidity", "temperature", "soil", "fertilizer", "toxicity", "pet_safe_note",
  ]) {
    fd.set(k, get(k))
  }
  fd.set("slug", recordSlug(record))
  for (const k of ["price", "compare_at_price", "stock_count", "low_stock_threshold", "box_height_cm", "box_width_cm", "box_breadth_cm", "weight_kg"]) {
    fd.set(k, cleanNumber(record[k]))
  }

  // Plant-only selects fall back to the form's defaults when left blank.
  fd.set("difficulty", enumValue(record.difficulty, "beginner"))
  fd.set("light_requirement", enumValue(record.light_requirement, "medium"))
  fd.set("water_requirement", enumValue(record.water_requirement, "medium"))
  fd.set("size", enumValue(record.size, "medium"))

  for (const k of ["is_new_arrival", "is_pet_safe", "is_imported", "is_featured", "published"]) {
    if (truthy(record[k])) fd.set(k, "on")
  }

  if (isPlant) {
    for (const raw of get("use_case_tags").split(/[;|]/).map((t) => t.trim()).filter(Boolean)) {
      const tag = matchIgnoringCase(raw, lookups.useCaseTags)
      if (!tag) return { error: `Unknown use case tag “${raw}”. Use: ${lookups.useCaseTags.join("; ")}.` }
      fd.append("use_case_tags", tag)
    }
  }

  // Variants: only slots with a name are saved. Price is required so a variant can't end up free by accident. Each
  // variant has its own photo (variant_N_image_url); the product's stock and price come from its variants.
  const slots = (prefix: RegExp) =>
    Object.keys(record)
      .map((k) => Number(k.match(prefix)?.[1]))
      .filter((n) => Number.isInteger(n))
      .sort((a, b) => a - b)
  const variantSkus: string[] = []
  for (const n of slots(/^variant_(\d+)_name$/)) {
    const name = get(`variant_${n}_name`)
    if (!name) continue
    const price = cleanNumber(record[`variant_${n}_price`])
    if (!price) return { error: `Variant ${n} (\u201c${name}\u201d) needs a price.` }
    const sku = get(`variant_${n}_sku`) || `${get("sku")}-${variantSkus.length + 1}`
    variantSkus.push(sku)
    fd.append("variant_id", "")
    fd.append("variant_key", String(n))
    fd.append("variant_name", name)
    fd.append("variant_sku", sku)
    fd.append("variant_price", price)
    fd.append("variant_stock", cleanNumber(record[`variant_${n}_stock`]) || "0")
    fd.append("variant_photo", get(`variant_${n}_image_url`))
  }

  // No variants: the product becomes a single "Standard" variant (made when it is saved) and image_url_1 is its photo.
  if (variantSkus.length === 0) {
    fd.set("standard_photo", get("image_url_1"))
    variantSkus.push(`${get("sku")}-1`)
  }

  return { formData: fd, variantSkus }
}

/** The downloadable template: every column, plus two example rows (auto-skipped on import). */
export function templateRows(): string[][] {
  const plant: ImportRecord = {
    name: "Monstera Deliciosa", sku: `${EXAMPLE_SKU_PREFIX}AROID-001`, slug: "monstera-deliciosa", category_name: "Aroids",
    short_description: "Iconic split-leaf climber, easy to grow.",
    description: "A classic statement plant with large, fenestrated leaves. Thrives in bright indirect light.",
    price: "3500", compare_at_price: "4200", stock_count: "25", low_stock_threshold: "10",
    box_height_cm: "40", box_width_cm: "25", box_breadth_cm: "25", weight_kg: "1.2",
    difficulty: "beginner", light_requirement: "bright", water_requirement: "medium", size: "medium",
    is_new_arrival: "yes", is_pet_safe: "no", is_imported: "no", is_featured: "no", published: "no",
    use_case_tags: "Air-Purifying; Statement Plants",
    light_summary: "Bright indirect light", water_summary: "When the top 2 in of soil is dry",
    light: "Bright, indirect light. Avoid harsh afternoon sun.", water: "Every 7-10 days; let the top layer dry out.",
    humidity: "Average to high", temperature: "18-30 C", soil: "Chunky, well-draining aroid mix",
    fertilizer: "Balanced liquid feed monthly in the growing season", toxicity: "Toxic if ingested", pet_safe_note: "Keep away from cats and dogs",
    meta_title: "Monstera Deliciosa Price in Pakistan", meta_description: "Buy Monstera Deliciosa in Pakistan. Nursery-grown, delivered nationwide.",
    variant_1_name: 'Medium - 6" pot', variant_1_sku: `${EXAMPLE_SKU_PREFIX}AROID-001-MED`, variant_1_price: "3500", variant_1_stock: "15",
    variant_1_image_url: "https://images.muffinplants.com/products/example-medium.avif",
    variant_2_name: 'Large - 8" pot', variant_2_sku: `${EXAMPLE_SKU_PREFIX}AROID-001-LRG`, variant_2_price: "5500", variant_2_stock: "10",
    variant_2_image_url: "https://images.muffinplants.com/products/example-large.avif",
  }
  const pot: ImportRecord = {
    name: "Terracotta Pot 6 inch", sku: `${EXAMPLE_SKU_PREFIX}POT-001`, slug: "terracotta-pot-6-inch", category_name: "Pots",
    short_description: "Classic unglazed terracotta pot.",
    description: "Breathable unglazed terracotta pot with a drainage hole, ideal for most houseplants.",
    price: "450", stock_count: "60", low_stock_threshold: "10", weight_kg: "0.8", published: "no",
    image_url_1: "https://images.muffinplants.com/products/example-pot.avif",
  }
  return [TEMPLATE_COLUMNS, ...[plant, pot].map((r) => TEMPLATE_COLUMNS.map((c) => r[c] ?? ""))]
}

/* ------------------------------------------------------------------ export */

export type ExportProduct = { id: string; published_at: string | null; use_case_tags: string[] | null } & Record<string, unknown>
export type ExportVariant = { name: string; sku: string; price: number | string; stock_count: number | null; image_url: string | null }

const BOOLEAN_COLUMNS = new Set(["is_new_arrival", "is_pet_safe", "is_imported", "is_featured"])
const cellText = (v: unknown) => (v === null || v === undefined ? "" : String(v))
const yesNo = (v: unknown) => (v ? "yes" : "no")

/** The database columns to read for `productsToRows` (published is derived from published_at). */
export const EXPORT_PRODUCT_COLUMNS = ["id", "published_at", ...SIMPLE_COLUMNS.filter((c) => c !== "published")].join(", ")

/**
 * Turns products into rows in the same layout as the import template, so an exported file opens in a spreadsheet
 * and maps back onto the form's fields with nothing ignored. The number of variant columns grows to fit the
 * product that has the most. `variants` must already be sorted and active-only, each with its photo. A product
 * whose only variant is the automatic "Standard" one is exported the way it was imported: no variant columns, its
 * photo in image_url_1.
 */
export function productsToRows(products: ExportProduct[], variants: Map<string, ExportVariant[]>): string[][] {
  const isStandardOnly = (list: ExportVariant[]) => list.length === 1 && list[0].name.trim().toLowerCase() === "standard"
  const namedVariants = (id: string) => {
    const list = variants.get(id) ?? []
    return isStandardOnly(list) ? [] : list
  }
  const variantSlots = Math.max(IMPORT_VARIANT_SLOTS, ...products.map((p) => namedVariants(p.id).length))
  const columns = columnsFor(variantSlots)

  const rows = products.map((p) => {
    const all = variants.get(p.id) ?? []
    const vars = namedVariants(p.id)
    return columns.map((col) => {
      if (col === "published") return yesNo(p.published_at)
      if (BOOLEAN_COLUMNS.has(col)) return yesNo(p[col])
      if (col === "use_case_tags") return (p.use_case_tags ?? []).join("; ")
      if (col === "image_url_1") return isStandardOnly(all) ? cellText(all[0].image_url) : ""

      const variant = col.match(/^variant_(\d+)_(name|sku|price|stock|image_url)$/)
      if (variant) {
        const v = vars[Number(variant[1]) - 1]
        if (!v) return ""
        return cellText(variant[2] === "stock" ? v.stock_count : v[variant[2] as "name" | "sku" | "price" | "image_url"])
      }
      return cellText(p[col])
    })
  })
  return [columns, ...rows]
}
