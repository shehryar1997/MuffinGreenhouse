// Derives a product's slug and SKU from its name (used by the CSV import, where neither is typed in).
// Pure and dependency-free. Output always satisfies the product form's rules (see parseProductFields
// in app/admin/products/actions.ts):
//   slug: ^[a-z0-9]+(?:-[a-z0-9]+)*$, max 100 characters
//   sku : ^[A-Za-z0-9][A-Za-z0-9._-]{1,39}$

const MAX_SLUG_LENGTH = 100

// Three-letter SKU prefix per category. Keep in sync with the `categories` table; an unknown
// category falls back to the first three letters of its name.
const CATEGORY_CODES: Record<string, string> = {
  agaves: "AGV",
  aroids: "ARO",
  "cacti & succulents": "CAC",
  fertilizer: "FER",
  hoyas: "HOY",
  mangaves: "MAN",
  orchids: "ORC",
  "other equipment": "EQP",
  "planting media": "MED",
  pots: "POT",
  sansevierias: "SAN",
}

// Words that add length but no meaning to a SKU.
const SKU_FILLER_WORDS = new Set(["a", "an", "and", "the", "of", "for", "with", "in"])

/** "Pink Princess Philodendron" -> ["pink", "princess", "philodendron"] (lowercase a-z0-9 words only). */
function words(text: string): string[] {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // é -> e
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "") // don't -> dont, not "don-t"
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/** Joins words with hyphens without exceeding `max` characters, cutting at a word boundary. */
function joinWithin(parts: string[], max: number): string {
  let out = ""
  for (const part of parts) {
    const next = out ? `${out}-${part}` : part
    if (next.length > max) break
    out = next
  }
  // A single word longer than the limit: hard-cut it rather than return nothing.
  return out || (parts[0] ?? "").slice(0, max)
}

/** "Monstera Deliciosa" -> "monstera-deliciosa". Empty when the name has no latin letters or digits. */
export function slugFromName(name: string): string {
  return joinWithin(words(name), MAX_SLUG_LENGTH)
}

const SKU_BODY_MAX = 6

/**
 * The name part of a SKU: the initial of each word, plus the first number in the name whole
 * ("Terracotta Pot 6 inch" -> "TP6I"), capped at 6 characters. A one-word name uses its first three
 * letters instead ("Osmocote" -> "OSM"). Empty when the name has no latin letters or digits.
 */
function skuBody(name: string): string {
  const all = words(name)
  const tokens = all.filter((w) => !SKU_FILLER_WORDS.has(w))
  const used = tokens.length > 0 ? tokens : all
  if (used.length === 1) return used[0].slice(0, 3).toUpperCase()

  let sawNumber = false
  let body = ""
  for (const token of used) {
    const number = token.match(/^\d+/)?.[0]
    if (number) {
      if (sawNumber) continue // "20-20-20" contributes one "20", not three
      sawNumber = true
      body += number
    } else {
      body += token[0]
    }
  }
  return body.slice(0, SKU_BODY_MAX).toUpperCase()
}

/** ("Monstera Deliciosa", "Aroids") -> "ARO-MD". The running number is added by `uniqueSku`. */
export function skuFromName(name: string, category: string): string {
  const key = category.trim().toLowerCase()
  const code = CATEGORY_CODES[key] ?? (words(category).join("").slice(0, 3).toUpperCase() || "MG")
  const body = skuBody(name)
  return body ? `${code}-${body}` : ""
}

/**
 * Returns `base` if it is free, otherwise `base-2`, `base-3`, ... (trimmed so the suffix still fits
 * within `maxLength`). `taken` holds lowercase values already in use (the database plus earlier rows
 * of the same file) and the chosen value is added to it, so calling this row by row keeps a whole
 * import unique.
 */
export function makeUnique(base: string, taken: Set<string>, maxLength: number): string {
  let candidate = base
  for (let n = 2; taken.has(candidate.toLowerCase()); n++) {
    const suffix = `-${n}`
    candidate = `${base.slice(0, maxLength - suffix.length).replace(/[-.]+$/, "")}${suffix}`
  }
  taken.add(candidate.toLowerCase())
  return candidate
}

export const uniqueSlug = (name: string, takenSlugs: Set<string>) => {
  const base = slugFromName(name)
  return base ? makeUnique(base, takenSlugs, MAX_SLUG_LENGTH) : ""
}

/**
 * "ARO-MD-01", then "ARO-MD-02" for the next product with the same code, and so on. Same `taken`
 * contract as `makeUnique` (lowercase values in use; the chosen SKU is added to it).
 */
export const uniqueSku = (name: string, category: string, takenSkus: Set<string>) => {
  const base = skuFromName(name, category)
  if (!base) return ""
  for (let n = 1; ; n++) {
    const candidate = `${base}-${String(n).padStart(2, "0")}`
    if (!takenSkus.has(candidate.toLowerCase())) {
      takenSkus.add(candidate.toLowerCase())
      return candidate
    }
  }
}
