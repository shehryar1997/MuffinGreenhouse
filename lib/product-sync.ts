// Saving a product's variants and their photos: shared by the admin product actions (form and CSV import) and
// kept out of the "use server" file so it can be exercised on its own. Server-only: uses the service-role client.
import { supabaseAdmin } from "@/supabase/admin-client"
import { deleteUnreferencedProductImages } from "@/lib/product-images"

type PgError = { code?: string; message: string }

export function friendlyDbError(error: PgError): string {
  if (error.code === "23505") {
    return "That SKU or slug is already used by another product. Change it and save again."
  }
  return error.message
}

// A variant row as submitted by the product form (or built from a CSV row): repeatable fields read in order.
export type VariantInput = {
  id: string
  key: string
  name: string
  sku: string
  price: number
  stock: number
  /** The variant's photos in display order; the first is its thumbnail. Empty = none. */
  photos: string[]
  compareAt: number | null
  weightKg: number | null
  boxHeightCm: number | null
  boxWidthCm: number | null
  boxBreadthCm: number | null
}

// Blank -> null; anything else a number (NaN when it isn't one, which the caller reports).
const optional = (raw: string | undefined) => (raw === undefined || raw.trim() === "" ? null : Number(raw))
// "Medium - 8\" pot" -> "MEDIUM-8-POT": readable SKUs for sizes typed without one.
const skuPart = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 16)

// One variant's photos as submitted: a JSON array of URLs from the form, or a single plain URL (CSV import).
export function parsePhotoList(raw: string | undefined): string[] {
  const value = (raw ?? "").trim()
  if (!value) return []
  let list: unknown = [value]
  if (value.startsWith("[")) {
    try {
      list = JSON.parse(value)
    } catch {
      list = []
    }
  }
  if (!Array.isArray(list)) return []
  const urls = list.filter((u): u is string => typeof u === "string").map((u) => u.trim()).filter(Boolean)
  return [...new Set(urls)]
}

export function readVariantInputs(formData: FormData): VariantInput[] {
  const ids = formData.getAll("variant_id") as string[]
  // The form's own key for each variant row, so the "show on card" choice can point at a variant with no id yet.
  const keys = formData.getAll("variant_key") as string[]
  const names = formData.getAll("variant_name") as string[]
  const skus = formData.getAll("variant_sku") as string[]
  const prices = formData.getAll("variant_price") as string[]
  const stocks = formData.getAll("variant_stock") as string[]
  const photos = formData.getAll("variant_photo") as string[]
  const compareAts = formData.getAll("variant_compare_at") as string[]
  const weights = formData.getAll("variant_weight") as string[]
  const boxH = formData.getAll("variant_box_h") as string[]
  const boxW = formData.getAll("variant_box_w") as string[]
  const boxB = formData.getAll("variant_box_b") as string[]
  const productSku = String(formData.get("sku") ?? "").trim()
  const used = new Set<string>()
  return names
    .map((name, i) => {
      // An empty SKU becomes the product SKU plus the size ("MON-DEL-MEDIUM"), numbered if that is taken.
      let sku = skus[i]?.trim() || `${productSku}-${skuPart(name.trim()) || i + 1}`
      if (!skus[i]?.trim() && used.has(sku)) sku = `${sku}-${i + 1}`
      used.add(sku)
      return {
        id: (ids[i] ?? "").trim(),
        key: (keys[i] ?? "").trim(),
        name: name.trim(),
        sku,
        price: Number(prices[i] || 0),
        stock: Number(stocks[i] || 0),
        photos: parsePhotoList(photos[i]),
        compareAt: optional(compareAts[i]),
        weightKg: optional(weights[i]),
        boxHeightCm: optional(boxH[i]),
        boxWidthCm: optional(boxW[i]),
        boxBreadthCm: optional(boxB[i]),
      }
    })
    .filter((v) => v.name.length > 0)
}

type StockStatus = "in_stock" | "low_stock" | "out_of_stock"
function stockStatusFor(stock: number, threshold: number): StockStatus {
  if (stock <= 0) return "out_of_stock"
  return stock <= threshold ? "low_stock" : "in_stock"
}

// Variants, and the photos each has, are SYNCED against what's already stored: existing rows are updated in
// place, only genuinely new ones are inserted, only removed ones are deleted, instead of wiping and recreating every
// row on each save. That keeps row ids stable (carts, orders and wishlists point at variant ids) and avoids
// needless writes. Returns an error message, or null on success.
export async function syncVariantsAndPhotos(
  productId: string,
  formData: FormData,
  fields: Record<string, unknown>,
  currentCardVariantId: string | null
): Promise<string | null> {
  const variants = await syncVariants(productId, formData, fields)
  if ("error" in variants) return variants.error
  const photoError = await syncPhotos(productId, variants.photoByVariantId)
  if (photoError) return photoError

  // The variant whose photo the shop card shows (null = automatic: the cheapest variant with a photo).
  const cardKey = String(formData.get("card_variant") ?? "").trim()
  const cardVariantId = cardKey ? (variants.idByKey.get(cardKey) ?? null) : null
  if (cardVariantId !== currentCardVariantId) {
    const { error } = await supabaseAdmin.from("products").update({ card_variant_id: cardVariantId }).eq("id", productId)
    if (error) return `Saving which photo the shop card shows failed: ${error.message}`
  }
  return null
}

export type SyncedVariants = {
  /** The form's key for each variant row -> its database id (also for variants created by this save). */
  idByKey: Map<string, string>
  /** Database id -> the photos that variant should have (empty = none), in variant order. */
  photoByVariantId: Map<string, { photos: string[]; name: string }>
}

export async function syncVariants(productId: string, formData: FormData, fields: Record<string, unknown>): Promise<{ error: string } | SyncedVariants> {
  const named = readVariantInputs(formData)
  const threshold = Number(fields.low_stock_threshold ?? 3)

  const { data: existing, error: readError } = await supabaseAdmin
    .from("product_variants")
    .select("id, name")
    .eq("product_id", productId)
  if (readError) return { error: `Could not read the existing variants: ${readError.message}` }
  const existingIds = new Set((existing ?? []).map((v) => v.id as string))

  // No variants entered: a draft with none (publishing needs at least one), so every stored variant is removed.
  const rows = named.map((r, i) => ({
    id: r.id,
    key: r.key,
    photos: r.photos,
    values: {
      name: r.name,
      sku: r.sku,
      price: r.price,
      stock_count: r.stock,
      // Also recomputed by the database trigger; set here so the row is right even before it runs.
      stock_status: stockStatusFor(r.stock, threshold),
      // 0 means "not set" for these (the database only accepts positive box sizes).
      compare_at_price: r.compareAt || null,
      weight_kg: r.weightKg || null,
      box_height_cm: r.boxHeightCm || null,
      box_width_cm: r.boxWidthCm || null,
      box_breadth_cm: r.boxBreadthCm || null,
      sort_order: i,
      is_default: i === 0,
      is_active: true,
    },
  }))

  if (rows.some((r) => !Number.isFinite(r.values.price) || r.values.price < 0 || !Number.isFinite(r.values.stock_count) || r.values.stock_count < 0)) {
    return { error: "Variant prices and stock must be valid, non-negative numbers." }
  }
  if (new Set(rows.map((r) => r.values.sku)).size !== rows.length) {
    return { error: "Two variants have the same SKU. Every variant needs its own unique SKU." }
  }

  const keptIds = new Set<string>()
  const idByKey = new Map<string, string>()
  const photoByVariantId = new Map<string, { photos: string[]; name: string }>()
  for (const { id, key, photos, values } of rows) {
    let variantId = id
    if (id && existingIds.has(id)) {
      keptIds.add(id)
      const { error } = await supabaseAdmin.from("product_variants").update(values).eq("id", id).eq("product_id", productId)
      if (error) return { error: `Saving variant \u201c${values.name}\u201d failed: ${friendlyDbError(error)}` }
    } else {
      const { data: created, error } = await supabaseAdmin.from("product_variants").insert({ ...values, product_id: productId }).select("id").single()
      if (error) return { error: `Saving variant \u201c${values.name}\u201d failed: ${friendlyDbError(error)}` }
      variantId = created.id as string
    }
    if (key) idByKey.set(key, variantId)
    photoByVariantId.set(variantId, { photos, name: values.name })
  }

  // Variants removed in the form. A variant that appears in past orders can't be deleted
  // (order history points at it), so it is retired instead: hidden from the shop, stock zeroed.
  // (Their photos are cleaned up by syncPhotos: deleting a variant leaves its photo rows with no variant.)
  for (const id of existingIds) {
    if (keptIds.has(id)) continue
    const { error } = await supabaseAdmin.from("product_variants").delete().eq("id", id)
    if (!error) continue
    if (error.code === "23503") {
      const { error: retireError } = await supabaseAdmin
        .from("product_variants")
        .update({ is_active: false, stock_count: 0, stock_status: "out_of_stock" })
        .eq("id", id)
      if (retireError) return { error: `Removing a variant failed: ${retireError.message}` }
    } else {
      return { error: `Removing a variant failed: ${error.message}` }
    }
  }
  return { idByKey, photoByVariantId }
}

// Gives every variant exactly the photos the form submitted, in that order (none = no photos), and removes every
// photo that belongs to no variant: there are no general photos. Photos are matched by URL, so an unchanged photo keeps
// its row and only new ones are inserted. Only a variant's first photo is is_primary (the SQL search and order
// functions pick "primary first" to get a variant's thumbnail). Removed photos are deleted from Cloudflare R2 too,
// unless another row still uses the same file.
export async function syncPhotos(productId: string, wanted: Map<string, { photos: string[]; name: string }>): Promise<string | null> {
  const { data, error: readError } = await supabaseAdmin
    .from("product_images")
    .select("id, url, sort_order, variant_id, is_primary, alt_text")
    .eq("product_id", productId)
  if (readError) return `Could not read the existing photos: ${readError.message}`
  const rows = (data ?? []) as { id: string; url: string; sort_order: number | null; variant_id: string | null; is_primary: boolean | null; alt_text: string | null }[]

  const removeIds: string[] = []
  const oldUrls: string[] = []
  const adopted = new Set<string>()
  const drop = (row: { id: string; url: string }) => {
    removeIds.push(row.id)
    oldUrls.push(row.url)
  }

  // sort_order runs across the whole product (variant by variant), so it is unique per photo.
  let order = 0
  for (const [variantId, { photos, name }] of wanted) {
    const own = rows.filter((r) => r.variant_id === variantId)
    const wantedUrls = new Set(photos)
    own.filter((r) => !wantedUrls.has(r.url)).forEach(drop)
    // Two rows of one variant with the same file: keep the first, drop the rest.
    const kept = new Map<string, (typeof rows)[number]>()
    for (const r of own.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))) {
      if (!wantedUrls.has(r.url)) continue
      if (kept.has(r.url)) removeIds.push(r.id)
      else kept.set(r.url, r)
    }

    for (const [index, url] of photos.entries()) {
      const sortOrder = order++
      const isPrimary = index === 0
      const keep = kept.get(url)
      if (keep) {
        if (keep.sort_order !== sortOrder || !!keep.is_primary !== isPrimary || keep.alt_text !== name) {
          const { error } = await supabaseAdmin.from("product_images").update({ sort_order: sortOrder, is_primary: isPrimary, alt_text: name }).eq("id", keep.id)
          if (error) return `Saving photos failed: ${error.message}`
        }
        continue
      }
      // A photo from before variants owned photos (no variant) that is the same file: give it to this variant.
      const legacy = rows.find((r) => r.variant_id === null && r.url === url && !adopted.has(r.id))
      const { error } = legacy
        ? await supabaseAdmin.from("product_images").update({ variant_id: variantId, sort_order: sortOrder, is_primary: isPrimary, alt_text: name }).eq("id", legacy.id)
        : await supabaseAdmin.from("product_images").insert({ product_id: productId, variant_id: variantId, url, alt_text: name, sort_order: sortOrder, is_primary: isPrimary })
      if (error) return `Saving photos failed: ${error.message}`
      if (legacy) adopted.add(legacy.id)
    }
  }

  // Photos with no variant: legacy general photos, or ones left behind by a deleted variant.
  rows.filter((r) => r.variant_id === null && !adopted.has(r.id)).forEach(drop)

  // Removals last, so a failure part-way can never leave a variant without the photos it should have.
  if (removeIds.length > 0) {
    const { error } = await supabaseAdmin.from("product_images").delete().in("id", removeIds)
    if (error) return `Removing old photos failed: ${error.message}`
  }
  await deleteUnreferencedProductImages(oldUrls)
  return null
}
