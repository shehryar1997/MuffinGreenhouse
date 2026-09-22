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
  photo: string
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
        photo: (photos[i] ?? "").trim(),
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

// Variants, and the one photo each has, are SYNCED against what's already stored: existing rows are updated in
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

  // The variant whose photo the shop card shows. Standard-only products have no choice to make (null = automatic).
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
  /** Database id -> the photo that variant should have (empty string = none), in variant order. */
  photoByVariantId: Map<string, { photo: string; name: string }>
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

  // No variants entered: the product is sold as one "Standard" variant built from the product's own price and stock.
  let inputs = named
  if (named.length === 0) {
    const standard = (existing ?? []).find((v) => String(v.name).trim().toLowerCase() === "standard")
    inputs = [
      {
        id: (standard?.id as string | undefined) ?? "",
        key: "standard",
        name: "Standard",
        sku: `${String(fields.sku)}-1`,
        price: Number(fields.price),
        stock: Number(fields.stock_count),
        photo: String(formData.get("standard_photo") ?? "").trim(),
        compareAt: (fields.compare_at_price as number | null) ?? null,
        weightKg: null,
        boxHeightCm: null,
        boxWidthCm: null,
        boxBreadthCm: null,
      },
    ]
  }

  const rows = inputs.map((r, i) => ({
    id: r.id,
    key: r.key,
    photo: r.photo,
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
  const photoByVariantId = new Map<string, { photo: string; name: string }>()
  for (const { id, key, photo, values } of rows) {
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
    photoByVariantId.set(variantId, { photo, name: values.name })
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

// Gives every variant exactly the photo the form submitted (none = no photo), and removes every photo that belongs
// to no variant: there are no general photos. Replaced and removed photos are deleted from Cloudflare R2 too,
// unless another row still uses the same file.
export async function syncPhotos(productId: string, wanted: Map<string, { photo: string; name: string }>): Promise<string | null> {
  const { data, error: readError } = await supabaseAdmin
    .from("product_images")
    .select("id, url, sort_order, variant_id")
    .eq("product_id", productId)
  if (readError) return `Could not read the existing photos: ${readError.message}`
  const rows = (data ?? []) as { id: string; url: string; sort_order: number | null; variant_id: string | null }[]

  const removeIds: string[] = []
  const oldUrls: string[] = []
  const adopted = new Set<string>()
  const drop = (row: { id: string; url: string }) => {
    removeIds.push(row.id)
    oldUrls.push(row.url)
  }

  let order = 0
  for (const [variantId, { photo, name }] of wanted) {
    const sortOrder = order++
    const own = rows.filter((r) => r.variant_id === variantId).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    if (!photo) {
      own.forEach(drop)
      continue
    }
    const [keep, ...extras] = own
    extras.forEach(drop)
    if (keep) {
      if (keep.url !== photo) oldUrls.push(keep.url)
      if (keep.url !== photo || keep.sort_order !== sortOrder) {
        const { error } = await supabaseAdmin.from("product_images").update({ url: photo, sort_order: sortOrder, is_primary: true, alt_text: name }).eq("id", keep.id)
        if (error) return `Saving photos failed: ${error.message}`
      }
      continue
    }
    // A photo from before variants owned photos (no variant) that is the same file: give it to this variant.
    const legacy = rows.find((r) => r.variant_id === null && r.url === photo && !adopted.has(r.id))
    const { error } = legacy
      ? await supabaseAdmin.from("product_images").update({ variant_id: variantId, sort_order: sortOrder, is_primary: true, alt_text: name }).eq("id", legacy.id)
      : await supabaseAdmin.from("product_images").insert({ product_id: productId, variant_id: variantId, url: photo, alt_text: name, sort_order: sortOrder, is_primary: true })
    if (error) return `Saving photos failed: ${error.message}`
    if (legacy) adopted.add(legacy.id)
  }

  // Photos with no variant: legacy general photos, or ones left behind by a deleted variant.
  rows.filter((r) => r.variant_id === null && !adopted.has(r.id)).forEach(drop)

  // Removals last, so a failure part-way can never leave a variant without the photo it should have.
  if (removeIds.length > 0) {
    const { error } = await supabaseAdmin.from("product_images").delete().in("id", removeIds)
    if (error) return `Removing old photos failed: ${error.message}`
  }
  await deleteUnreferencedProductImages(oldUrls)
  return null
}
