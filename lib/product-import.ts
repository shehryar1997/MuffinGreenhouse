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
export const REQUIRED_COLUMNS = ["name", "sku", "category_name", "description"] as const

const SIMPLE_COLUMNS = [
  "name", "sku", "slug", "category_name", "short_description", "description",
  "low_stock_threshold",
  "box_height_cm", "box_width_cm", "box_breadth_cm", "weight_kg",
  "difficulty", "light_requirement", "water_requirement", "size",
  "is_new_arrival", "is_pet_safe", "is_imported", "is_featured", "published",
  "use_case_tags", "light", "water", "humidity", "temperature",
  "soil", "fertilizer", "toxicity", "pet_safe_note", "meta_title", "meta_description",
] as const

// Fields a variant slot has, in column order. sku and compare_at_price are both optional: sku is suggested from the
// variant name when left blank (see suggestSkuSuffix), compare_at_price simply stays unset.
const VARIANT_FIELDS = ["name", "sku", "price", "compare_at_price", "stock", "image_url"] as const

/**
 * Every column, in form order, with the given number of variant slots. Price, was price, stock and the photo all
 * belong to variants: each variant slot has its own. A row with no variants imports as a draft.
 */
export function columnsFor(variantSlots: number): string[] {
  return [
    ...SIMPLE_COLUMNS,
    ...Array.from({ length: variantSlots }, (_, i) => VARIANT_FIELDS.map((f) => `variant_${i + 1}_${f}`)).flat(),
  ]
}

export const TEMPLATE_COLUMNS = columnsFor(IMPORT_VARIANT_SLOTS)

const simple = new Set<string>(SIMPLE_COLUMNS)

// Alternative headers people are likely to use (matched after normalising, see `normalizeHeader`).
const ALIASES: Record<string, string> = {
  product_name: "name", product: "name", title: "name",
  category: "category_name",
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
  // Photos belong to variants; older sheets' product-level image columns are ignored.
  const variant = key.match(/^variant_(\d+)_(name|sku|price|compare_at_price|compare_at|was_price|stock|stock_count|image_url|image|photo_url|photo)$/)
  if (variant) {
    const field =
      variant[2] === "stock_count"
        ? "stock"
        : /^(image|photo)/.test(variant[2])
          ? "image_url"
          : /^(compare_at|was_price)$/.test(variant[2])
            ? "compare_at_price"
            : variant[2]
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

// Case/punctuation-insensitive, e.g. "air-purifying" == "Air Purifying". Also folds a simple trailing plural
// per word, so "Statement Plant" matches "Statement Plants".
const normalizeLoose = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
const foldPlural = (s: string) => s.replace(/s\b/g, "")

/**
 * Matches a sheet value against a fixed list of allowed values (a category name, a use-case tag), tolerating the
 * small mistakes a hand-typed sheet tends to have: wrong case, stray punctuation, and singular/plural ("Statement
 * Plant" vs "Statement Plants"). Falls back to undefined (a real error) rather than guessing when nothing is close.
 */
const matchIgnoringCase = (value: string, allowed: string[]): string | undefined => {
  const v = value.trim()
  if (!v) return undefined
  const exact = allowed.find((a) => a.toLowerCase() === v.toLowerCase())
  if (exact) return exact
  const folded = foldPlural(normalizeLoose(v))
  return allowed.find((a) => foldPlural(normalizeLoose(a)) === folded)
}

// Sizes get their conventional single/double-letter code; anything else falls back to a consonant-led abbreviation.
// Both are guesses meant to be reviewed and edited in the import preview, not the last word on a SKU.
const SIZE_SKU_SUFFIX: Record<string, string> = {
  xs: "XS", "extra small": "XS", small: "S", s: "S",
  medium: "M", m: "M", large: "L", l: "L",
  xl: "XL", "extra large": "XL",
}

/** Best-guess SKU suffix for a variant name (e.g. "Striata" -> "STR", "Small" -> "S"). Meant to be reviewed, not trusted blindly: plant-trade abbreviations ("Marginata" -> "MR") aren't derivable from the word itself. */
export function suggestSkuSuffix(name: string): string {
  const known = SIZE_SKU_SUFFIX[name.trim().toLowerCase()]
  if (known) return known
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "")
  if (!letters) return "VAR"
  const [first, ...rest] = letters
  const consonants = rest.filter((c) => !"AEIOU".includes(c))
  return (first + consonants.join("")).slice(0, 3) || letters.slice(0, 3)
}

// Cuts to at most `max` characters without splitting a word; falls back to a hard cut if the first word alone
// would overshoot (so a single very long word never produces an empty string).
function truncateAtWord(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, " ")
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const lastSpace = cut.lastIndexOf(" ")
  return (lastSpace > max * 0.4 ? cut.slice(0, lastSpace) : cut).trim()
}

// Nothing enforces these as hard limits (the form shows amber/red past them, but never blocks saving); they just
// keep an auto-generated title/description at the length search engines actually display before truncating.
const META_TITLE_MAX = 70
const META_DESCRIPTION_MAX = 170

/**
 * A default SEO title when the sheet leaves one blank. Long botanical/cultivar names (e.g. "Sansevieria sp. Hallii
 * Dark Pink Bat White Variegated") don't fit a search query, so this truncates to a searchable-length phrase at a
 * word boundary rather than blindly appending boilerplate to the full name.
 */
export function suggestMetaTitle(name: string): string {
  const n = name.trim()
  if (!n) return ""
  const suffix = " Price in Pakistan"
  if (n.length + suffix.length <= META_TITLE_MAX) return `${n}${suffix}`
  const truncated = truncateAtWord(n, META_TITLE_MAX - suffix.length)
  return truncated ? `${truncated}${suffix}` : truncateAtWord(n, META_TITLE_MAX)
}

/** A default SEO description: the human-written short_description (more naturally searchable than a formal name), or a generic fallback, truncated to fit. */
export function suggestMetaDescription(name: string, shortDescription: string): string {
  const base = shortDescription.trim() || `Buy ${name.trim()} online in Pakistan. Nursery-grown, delivered nationwide.`
  return truncateAtWord(base, META_DESCRIPTION_MAX)
}

// "Full sun" / "full-sun" / "FULL_SUN" -> "full_sun"; blank -> the form's default. If that doesn't land on one of
// the allowed values, tries a looser word-overlap match ("bright light" -> "bright", "full sun exposure" ->
// "full_sun") before giving up and returning the normalized-but-invalid text, so the form's own validation reports
// a clear error rather than this silently guessing wrong.
const enumValue = (v: string | undefined, allowed: string[], fallback: string) => {
  const raw = (v ?? "").trim()
  if (!raw) return fallback
  const normalized = raw.toLowerCase().replace(/[\s-]+/g, "_")
  if (allowed.includes(normalized)) return normalized
  const words = new Set(raw.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean))
  const loose = allowed.find((a) => a.split("_").every((part) => words.has(part)))
  return loose ?? normalized
}

export type ImportLookups = { categories: string[]; useCaseTags: string[] }

/** A generated field the import filled in because the sheet left it blank, for the review screen to show and let the admin edit before saving. */
export type ImportPreview = {
  metaTitle: string
  metaDescription: string
  variants: { slot: number; name: string; sku: string }[]
}

/**
 * Turns one row into the FormData the product form would submit. Returns an error message for anything that
 * can't be expressed as form input (unknown category or tag, a variant without a price...). Everything else
 * (required fields, ranges, formats) is left to the form's own validation, which runs on the result.
 */
export function recordToFormData(
  record: ImportRecord,
  lookups: ImportLookups
): { formData: FormData; variantSkus: string[]; preview: ImportPreview } | { error: string } {
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
    "name", "sku", "description", "short_description",
    "light", "water", "humidity", "temperature", "soil", "fertilizer", "toxicity", "pet_safe_note",
  ]) {
    fd.set(k, get(k))
  }
  const metaTitle = get("meta_title") || suggestMetaTitle(get("name"))
  const metaDescription = get("meta_description") || suggestMetaDescription(get("name"), get("short_description"))
  fd.set("meta_title", metaTitle)
  fd.set("meta_description", metaDescription)
  fd.set("slug", recordSlug(record))
  for (const k of ["low_stock_threshold", "box_height_cm", "box_width_cm", "box_breadth_cm", "weight_kg"]) {
    fd.set(k, cleanNumber(record[k]))
  }

  // Plant-only selects fall back to the form's defaults when left blank.
  fd.set("difficulty", enumValue(record.difficulty, ["beginner", "intermediate", "expert"], "beginner"))
  fd.set("light_requirement", enumValue(record.light_requirement, ["low", "medium", "bright", "full_sun"], "medium"))
  fd.set("water_requirement", enumValue(record.water_requirement, ["low", "medium", "high"], "medium"))
  fd.set("size", enumValue(record.size, ["small", "medium", "large"], "medium"))

  for (const k of ["is_new_arrival", "is_pet_safe", "is_imported", "is_featured", "published"]) {
    if (truthy(record[k])) fd.set(k, "on")
  }

  if (isPlant) {
    // Semicolon or pipe is the documented delimiter, but a comma is the easy mistake to make (spreadsheet cells
    // often read like prose), so it's accepted too.
    for (const raw of get("use_case_tags").split(/[;,|]/).map((t) => t.trim()).filter(Boolean)) {
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
  const variantPreview: ImportPreview["variants"] = []
  const usedSuffixes = new Set<string>()
  for (const n of slots(/^variant_(\d+)_name$/)) {
    const name = get(`variant_${n}_name`)
    if (!name) continue
    const price = cleanNumber(record[`variant_${n}_price`])
    if (!price) return { error: `Variant ${n} (\u201c${name}\u201d) needs a price.` }
    let sku = get(`variant_${n}_sku`)
    if (!sku) {
      let suffix = suggestSkuSuffix(name)
      let i = 2
      while (usedSuffixes.has(suffix)) suffix = `${suggestSkuSuffix(name)}${i++}`
      usedSuffixes.add(suffix)
      sku = `${get("sku")}-${suffix}`
    }
    variantSkus.push(sku)
    variantPreview.push({ slot: n, name, sku })
    fd.append("variant_id", "")
    fd.append("variant_key", String(n))
    fd.append("variant_name", name)
    fd.append("variant_sku", sku)
    fd.append("variant_price", price)
    fd.append("variant_compare_at", cleanNumber(record[`variant_${n}_compare_at_price`]))
    fd.append("variant_stock", cleanNumber(record[`variant_${n}_stock`]) || "0")
    fd.append("variant_photo", get(`variant_${n}_image_url`))
  }

  return { formData: fd, variantSkus, preview: { metaTitle, metaDescription, variants: variantPreview } }
}

/** The downloadable template: every column, plus two example rows (auto-skipped on import). */
export function templateRows(): string[][] {
  const plant: ImportRecord = {
    name: "Monstera Deliciosa", sku: `${EXAMPLE_SKU_PREFIX}AROID-001`, slug: "monstera-deliciosa", category_name: "Aroids",
    short_description: "Iconic split-leaf climber, easy to grow.",
    description: "A classic statement plant with large, fenestrated leaves. Thrives in bright indirect light.",
    low_stock_threshold: "10",
    box_height_cm: "40", box_width_cm: "25", box_breadth_cm: "25", weight_kg: "1.2",
    difficulty: "beginner", light_requirement: "bright", water_requirement: "medium", size: "medium",
    is_new_arrival: "yes", is_pet_safe: "no", is_imported: "no", is_featured: "no", published: "no",
    use_case_tags: "Air-Purifying; Statement Plants",
    light: "Bright, indirect light. Avoid harsh afternoon sun.", water: "Every 7-10 days; let the top layer dry out.",
    humidity: "Average to high", temperature: "18-30 C", soil: "Chunky, well-draining aroid mix",
    fertilizer: "Balanced liquid feed monthly in the growing season", toxicity: "Toxic if ingested", pet_safe_note: "Keep away from cats and dogs",
    meta_title: "Monstera Deliciosa Price in Pakistan", meta_description: "Buy Monstera Deliciosa in Pakistan. Nursery-grown, delivered nationwide.",
    variant_1_name: 'Medium - 6" pot', variant_1_sku: `${EXAMPLE_SKU_PREFIX}AROID-001-MED`, variant_1_price: "3500", variant_1_compare_at_price: "4200", variant_1_stock: "15",
    variant_1_image_url: "https://images.muffinplants.com/products/example-medium.avif",
    // Leaving variant_2_sku blank shows the auto-generated SKU: main SKU + a guessed suffix from the variant name,
    // editable in the import preview before anything is saved.
    variant_2_name: 'Large - 8" pot', variant_2_price: "5500", variant_2_stock: "10",
    variant_2_image_url: "https://images.muffinplants.com/products/example-large.avif",
  }
  const pot: ImportRecord = {
    name: "Terracotta Pot 6 inch", sku: `${EXAMPLE_SKU_PREFIX}POT-001`, slug: "terracotta-pot-6-inch", category_name: "Pots",
    short_description: "Classic unglazed terracotta pot.",
    description: "Breathable unglazed terracotta pot with a drainage hole, ideal for most houseplants.",
    low_stock_threshold: "10", weight_kg: "0.8", published: "no",
    variant_1_name: "Standard", variant_1_price: "450", variant_1_stock: "60",
    variant_1_image_url: "https://images.muffinplants.com/products/example-pot.avif",
  }
  return [TEMPLATE_COLUMNS, ...[plant, pot].map((r) => TEMPLATE_COLUMNS.map((c) => r[c] ?? ""))]
}

/* ------------------------------------------------------------------ export */

export type ExportProduct = { id: string; published_at: string | null; use_case_tags: string[] | null } & Record<string, unknown>
export type ExportVariant = {
  name: string
  sku: string
  price: number | string
  compare_at_price: number | string | null
  stock_count: number | null
  image_url: string | null
}

const BOOLEAN_COLUMNS = new Set(["is_new_arrival", "is_pet_safe", "is_imported", "is_featured"])
const cellText = (v: unknown) => (v === null || v === undefined ? "" : String(v))
const yesNo = (v: unknown) => (v ? "yes" : "no")

/** The database columns to read for `productsToRows` (published is derived from published_at). */
export const EXPORT_PRODUCT_COLUMNS = ["id", "published_at", ...SIMPLE_COLUMNS.filter((c) => c !== "published")].join(", ")

/**
 * Turns products into rows in the same layout as the import template, so an exported file opens in a spreadsheet
 * and maps back onto the form's fields with nothing ignored. The number of variant columns grows to fit the
 * product that has the most. `variants` must already be sorted and active-only, each with its photo.
 */
export function productsToRows(products: ExportProduct[], variants: Map<string, ExportVariant[]>): string[][] {
  const namedVariants = (id: string) => variants.get(id) ?? []
  const variantSlots = Math.max(IMPORT_VARIANT_SLOTS, ...products.map((p) => namedVariants(p.id).length))
  const columns = columnsFor(variantSlots)

  const rows = products.map((p) => {
    const vars = namedVariants(p.id)
    return columns.map((col) => {
      if (col === "published") return yesNo(p.published_at)
      if (BOOLEAN_COLUMNS.has(col)) return yesNo(p[col])
      if (col === "use_case_tags") return (p.use_case_tags ?? []).join("; ")

      const variant = col.match(/^variant_(\d+)_(name|sku|price|compare_at_price|stock|image_url)$/)
      if (variant) {
        const v = vars[Number(variant[1]) - 1]
        if (!v) return ""
        return cellText(variant[2] === "stock" ? v.stock_count : v[variant[2] as "name" | "sku" | "price" | "compare_at_price" | "image_url"])
      }
      return cellText(p[col])
    })
  })
  return [columns, ...rows]
}
