"use server"

import { supabaseAdmin } from "@/supabase/admin-client"
import { isAdminRequest, requireAdmin } from "@/lib/admin-auth"
import { deleteUnreferencedProductImages } from "@/lib/product-images"
import { isNonPlantCategoryName } from "@/lib/product-categories"
import { isAllowedImageUrl } from "@/lib/image-hosts"
import { BAD_BULK_REQUEST, cleanBulkIds, type BulkDeleteResult } from "@/lib/admin-bulk"
import { recordToFormData, type ImportRecord } from "@/lib/product-import"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { afterProductSaved } from "@/lib/stock-alerts"
import { choosePrimaryUrl } from "@/lib/product-photos"

// Fields copied when prefilling a new product from an existing one. Deliberately
// excludes id, sku and slug (sku/slug are UNIQUE), image data (kept as-is in the
// form), variants (their SKUs are unique too), and published/featured flags.
const PREFILL_COLUMNS = [
  "id",
  "sku",
  "name",
  "category_name",
  "description",
  "short_description",
  "price",
  "compare_at_price",
  "stock_count",
  "low_stock_threshold",
  "difficulty",
  "light_requirement",
  "water_requirement",
  "size",
  "is_new_arrival",
  "is_pet_safe",
  "is_imported",
  "meta_title",
  "meta_description",
  "light",
  "water",
  "humidity",
  "temperature",
  "soil",
  "fertilizer",
  "toxicity",
  "light_summary",
  "water_summary",
  "pet_safe_note",
  "box_height_cm",
  "box_width_cm",
  "box_breadth_cm",
  "weight_kg",
  "use_case_tags",
].join(", ")

export type PrefillProduct = {
  id: string
  sku: string
  name: string
  category_name: string | null
  description: string
  short_description: string | null
  price: number
  compare_at_price: number | null
  stock_count: number | null
  low_stock_threshold: number | null
  difficulty: string | null
  light_requirement: string
  water_requirement: string | null
  size: string | null
  is_new_arrival: boolean | null
  is_pet_safe: boolean | null
  is_imported: boolean | null
  meta_title: string | null
  meta_description: string | null
  light: string | null
  water: string | null
  humidity: string | null
  temperature: string | null
  soil: string | null
  fertilizer: string | null
  toxicity: string | null
  light_summary: string | null
  water_summary: string | null
  pet_safe_note: string | null
  box_height_cm: number | null
  box_width_cm: number | null
  box_breadth_cm: number | null
  weight_kg: number | null
  use_case_tags: string[]
}

const normalizeName = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase()

// Case-insensitive, whitespace-normalised exact-name lookup used by the
// "autofill from existing product" convenience on the new-product form.
export async function findProductsByName(name: string): Promise<{ matches: PrefillProduct[]; error?: string }> {
  if (!(await isAdminRequest())) {
    return { matches: [], error: "Your admin session has expired. Log in again." }
  }
  const wanted = normalizeName(name ?? "")
  if (!wanted) return { matches: [] }

  // Escape LIKE wildcards so names containing % or _ match literally.
  const escaped = wanted.replace(/[\\%_]/g, (c) => `\\${c}`)
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(PREFILL_COLUMNS)
    .ilike("name", `%${escaped}%`)
    .limit(50)
  if (error) return { matches: [], error: error.message }

  const matches = ((data ?? []) as unknown as PrefillProduct[]).filter((p) => normalizeName(p.name) === wanted)
  return { matches }
}

export async function getFormLookups() {
  await requireAdmin()
  const [{ data: categories }, { data: useCaseTags }] = await Promise.all([
    supabaseAdmin.from("categories").select("name").order("name"),
    supabaseAdmin.from("use_case_tags").select("name").order("name"),
  ])
  return {
    categories: (categories ?? []).map((c) => c.name as string),
    useCaseTags: (useCaseTags ?? []).map((t) => t.name as string),
  }
}

// products.light_requirement is NOT NULL, so Tools & Equipment get this neutral
// placeholder. It's meaningless for them: the storefront never shows or filters
// on it for those categories (see lib/product-categories.ts).
const NON_PLANT_LIGHT_PLACEHOLDER = "medium"

/** What a create/update/delete action hands back to the form. `undefined` = success (the action redirects). */
export type ProductActionResult = { error: string } | undefined

type PgError = { code?: string; message: string }

function friendlyDbError(error: PgError): string {
  if (error.code === "23505") {
    return "That SKU or slug is already used by another product. Change it and save again."
  }
  return error.message
}

// Blank -> null, otherwise a finite number (anything else is reported by the caller).
function optionalNumber(formData: FormData, name: string): number | null | "invalid" {
  const raw = formData.get(name)
  if (raw === null || String(raw).trim() === "") return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : "invalid"
}

function parseProductFields(
  formData: FormData,
  existingPublishedAt: string | null
): { fields: Record<string, unknown> } | { error: string } {
  const text = (name: string) => String(formData.get(name) ?? "").trim()
  const categoryName = text("category_name")
  // Tools & Equipment have no care info, size, box dimensions or tags. The form hides
  // those fields, but hidden values still submit (and may linger from a category
  // switch), so enforce it here.
  const isPlant = !isNonPlantCategoryName(categoryName)
  const careText = (name: string) => (isPlant ? text(name) || null : null)

  for (const [field, label] of [
    ["name", "Product name"],
    ["sku", "SKU"],
    ["slug", "Slug"],
    ["description", "Description"],
    ["category_name", "Category"],
  ] as const) {
    if (!text(field)) return { error: `${label} is required.` }
  }

  // Shape checks: these values end up in URLs, order documents and search, so refuse the obviously
  // malformed ones here with a message, rather than saving them or failing later in the database.
  const name = text("name")
  if (name.length < 3 || !/[\p{L}]/u.test(name)) return { error: "Product name must be at least 3 characters and contain letters." }
  if (name.length > 120) return { error: "Product name is too long (120 characters max)." }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text("slug")) || text("slug").length > 100) {
    return { error: "Slug can only use lowercase letters, numbers and single hyphens (e.g. monstera-deliciosa)." }
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,39}$/.test(text("sku"))) {
    return { error: "SKU must be 2–40 characters: letters, numbers, dots, hyphens or underscores (e.g. AROID-001-MED)." }
  }
  if (text("description").length < 10) return { error: "Description is too short. Write at least a sentence for customers." }
  if (text("description").length > 5000) return { error: "Description is too long (5,000 characters max)." }
  if (text("short_description").length > 300) return { error: "Short description is too long (300 characters max)." }
  if (text("meta_title").length > 70) return { error: "SEO title is too long (70 characters max)." }
  if (text("meta_description").length > 170) return { error: "SEO description is too long (170 characters max)." }

  const price = Number(formData.get("price"))
  if (!Number.isFinite(price) || price <= 0 || price > 10_000_000) return { error: "Price must be a number greater than 0." }

  const stockCount = Number(formData.get("stock_count") || 0)
  const lowStock = Number(formData.get("low_stock_threshold") || 10)
  if (!Number.isInteger(stockCount) || stockCount < 0 || stockCount > 1_000_000) return { error: "Stock must be a whole number, 0 or more." }
  if (!Number.isInteger(lowStock) || lowStock < 0 || lowStock > 100_000) return { error: "Low-stock alert level must be a whole number, 0 or more." }

  if (isPlant) {
    const oneOf = (field: string, allowed: string[], label: string) =>
      allowed.includes(text(field)) ? null : `${label} isn't valid. Pick one of the options in the form.`
    const enumError =
      oneOf("difficulty", ["beginner", "intermediate", "expert"], "Difficulty") ??
      oneOf("light_requirement", ["low", "medium", "bright", "full_sun"], "Light requirement") ??
      oneOf("water_requirement", ["low", "medium", "high"], "Water requirement") ??
      (text("size") ? oneOf("size", ["small", "medium", "large"], "Size") : null)
    if (enumError) return { error: enumError }
  }

  // next/image only loads from allow-listed hosts; an image on any other host would blank the product page.
  for (const raw of formData.getAll("image_url") as string[]) {
    const url = raw.trim()
    if (url && !isAllowedImageUrl(url)) {
      return { error: "One of the image addresses isn't from an allowed host. Remove it and upload the photo with the upload button instead." }
    }
  }

  const compareAt = optionalNumber(formData, "compare_at_price")
  const weight = optionalNumber(formData, "weight_kg")
  const boxHeight = optionalNumber(formData, "box_height_cm")
  const boxWidth = optionalNumber(formData, "box_width_cm")
  const boxBreadth = optionalNumber(formData, "box_breadth_cm")
  if ([compareAt, weight, boxHeight, boxWidth, boxBreadth].includes("invalid")) {
    return { error: "Compare-at price, weight and box dimensions must be valid numbers." }
  }

  if (typeof compareAt === "number" && compareAt <= price) {
    return { error: "Compare-at (original) price must be higher than the selling price, or left empty." }
  }
  if (typeof compareAt === "number" && compareAt > 10_000_000) return { error: "Compare-at price is too large." }

  // Delivery for Tools & Equipment is charged per kg (120 PKR/kg), so a product without a
  // weight would ship for free -- refuse to save one.
  if (!isPlant && !(typeof weight === "number" && weight > 0)) {
    return {
      error: `Weight (kg) is required for ${categoryName}. Delivery for these products is charged by weight (120 PKR per kg), so it must be greater than 0.`,
    }
  }
  if (typeof weight === "number" && weight < 0) return { error: "Weight can't be negative." }

  return {
    fields: {
      sku: text("sku"),
      name: text("name"),
      slug: text("slug"),
      description: text("description"),
      short_description: text("short_description") || null,
      // category_id/category_slug auto-resolve from category_name via the
      // trg_sync_product_category trigger -- we only ever send the name here.
      category_name: categoryName,
      price,
      compare_at_price: compareAt,
      currency: "PKR",
      stock_count: stockCount,
      low_stock_threshold: lowStock,
      difficulty: isPlant ? text("difficulty") : null,
      light_requirement: isPlant ? text("light_requirement") : NON_PLANT_LIGHT_PLACEHOLDER,
      water_requirement: isPlant ? text("water_requirement") : null,
      size: isPlant ? text("size") || null : null,
      is_new_arrival: formData.get("is_new_arrival") === "on",
      is_pet_safe: isPlant && formData.get("is_pet_safe") === "on",
      is_imported: isPlant && formData.get("is_imported") === "on",
      is_featured: formData.get("is_featured") === "on",
      // Keep the original publish date when a published product is simply re-saved --
      // it's what the "New" badge's 14-day window counts from.
      published_at: formData.get("published") === "on" ? (existingPublishedAt ?? new Date().toISOString()) : null,
      meta_title: text("meta_title") || null,
      meta_description: text("meta_description") || null,
      light: careText("light"),
      water: careText("water"),
      humidity: careText("humidity"),
      temperature: careText("temperature"),
      soil: careText("soil"),
      fertilizer: careText("fertilizer"),
      toxicity: careText("toxicity"),
      light_summary: careText("light_summary"),
      water_summary: careText("water_summary"),
      pet_safe_note: careText("pet_safe_note"),
      // trg_validate_product_tags rejects any value not already in
      // use_case_tags -- the form only offers valid checkboxes,
      // so this should always pass, but the DB guard stays as a backstop.
      use_case_tags: isPlant ? (formData.getAll("use_case_tags") as string[]) : [],
      // Shipping box dimensions apply to plants only (equipment is charged by weight).
      box_height_cm: isPlant ? (boxHeight as number | null) : null,
      box_width_cm: isPlant ? (boxWidth as number | null) : null,
      box_breadth_cm: isPlant ? (boxBreadth as number | null) : null,
      weight_kg: weight as number | null,
    },
  }
}

// The storefront is ISR-cached; the DB webhook also revalidates, but doing it here means a
// save is visible on the site immediately even if that webhook is down.
function revalidateStorefront() {
  revalidatePath("/", "layout")
}

// Validates and inserts one product with its images and variants. Shared by the form and the CSV import.
async function insertProduct(formData: FormData): Promise<{ error: string } | { id: string }> {
  const parsed = parseProductFields(formData, null)
  if ("error" in parsed) return { error: parsed.error }

  const { data, error } = await supabaseAdmin.from("products").insert(parsed.fields).select("id").single()
  if (error) return { error: friendlyDbError(error) }

  const syncError = await syncImagesAndVariants(data.id, formData)
  if (syncError) {
    // Don't leave a half-created product behind -- the form still holds everything, so the user can retry.
    await supabaseAdmin.from("products").delete().eq("id", data.id)
    return { error: syncError }
  }
  return { id: data.id }
}

export async function createProduct(formData: FormData): Promise<ProductActionResult> {
  await requireAdmin()
  const created = await insertProduct(formData)
  if ("error" in created) return { error: created.error }

  revalidatePath("/admin/products")
  revalidateStorefront()
  redirect("/admin/products")
}

export type ImportRowInput = { line: number; values: ImportRecord }
export type ImportRowResult = { line: number; ok: boolean; message?: string }

const MAX_ROWS_PER_CALL = 25

// CSV import, one batch at a time (the browser sends a few rows per call so a big sheet never hits a request
// size or time limit). Each row is turned into the same FormData the product form submits and saved through the
// same code, so it obeys every rule the form does. With `dryRun` nothing is written: rows are only checked,
// including against products already in the shop.
export async function importProductRows(rows: ImportRowInput[], dryRun: boolean): Promise<{ results: ImportRowResult[]; error?: string }> {
  if (!(await isAdminRequest())) return { results: [], error: "Your admin session has expired. Log in again." }
  if (rows.length > MAX_ROWS_PER_CALL) return { results: [], error: `Too many rows in one batch (max ${MAX_ROWS_PER_CALL}).` }

  const lookups = await getFormLookups()
  const results = new Map<number, ImportRowResult>()
  const fail = (line: number, message: string) => results.set(line, { line, ok: false, message })

  const checked: { line: number; formData: FormData; sku: string; slug: string; variantSkus: string[] }[] = []
  for (const { line, values } of rows) {
    const built = recordToFormData(values, lookups)
    if ("error" in built) {
      fail(line, built.error)
      continue
    }
    const parsed = parseProductFields(built.formData, null)
    if ("error" in parsed) {
      fail(line, parsed.error)
      continue
    }
    checked.push({ line, formData: built.formData, sku: parsed.fields.sku as string, slug: parsed.fields.slug as string, variantSkus: built.variantSkus })
  }

  // SKUs and slugs are UNIQUE: report a clash by name up front instead of as a database error.
  if (checked.length > 0) {
    const [{ data: skuHits, error: e1 }, { data: slugHits, error: e2 }, { data: variantHits, error: e3 }] = await Promise.all([
      supabaseAdmin.from("products").select("sku").in("sku", checked.map((c) => c.sku)),
      supabaseAdmin.from("products").select("slug").in("slug", checked.map((c) => c.slug)),
      supabaseAdmin.from("product_variants").select("sku").in("sku", checked.flatMap((c) => c.variantSkus)),
    ])
    if (e1 || e2 || e3) return { results: [], error: (e1 ?? e2 ?? e3)?.message ?? "Could not check existing products." }
    const usedSkus = new Set((skuHits ?? []).map((r) => r.sku as string))
    const usedSlugs = new Set((slugHits ?? []).map((r) => r.slug as string))
    const usedVariantSkus = new Set((variantHits ?? []).map((r) => r.sku as string))

    for (const c of checked) {
      const clash = usedSkus.has(c.sku)
        ? `SKU “${c.sku}” is already used by another product.`
        : usedSlugs.has(c.slug)
          ? `Slug “${c.slug}” is already used by another product.`
          : c.variantSkus.find((s) => usedVariantSkus.has(s))
            ? `Variant SKU “${c.variantSkus.find((s) => usedVariantSkus.has(s))}” is already in use.`
            : null
      if (clash) {
        fail(c.line, clash)
        continue
      }
      if (dryRun) {
        results.set(c.line, { line: c.line, ok: true })
        continue
      }
      try {
        const created = await insertProduct(c.formData)
        if ("error" in created) fail(c.line, created.error)
        else results.set(c.line, { line: c.line, ok: true })
      } catch (err) {
        fail(c.line, err instanceof Error ? err.message : "Unexpected error while saving this row.")
      }
    }
  }

  if (!dryRun && [...results.values()].some((r) => r.ok)) {
    revalidatePath("/admin/products")
    revalidateStorefront()
  }
  return { results: rows.map((r) => results.get(r.line) ?? { line: r.line, ok: false, message: "Row was not processed." }) }
}

export async function updateProduct(productId: string, formData: FormData): Promise<ProductActionResult> {
  await requireAdmin()

  const { data: existing, error: readError } = await supabaseAdmin
    .from("products")
    .select("published_at, price, stock_status")
    .eq("id", productId)
    .maybeSingle()
  if (readError) return { error: readError.message }
  if (!existing) return { error: "This product no longer exists. It may have been deleted." }

  const parsed = parseProductFields(formData, (existing.published_at as string | null) ?? null)
  if ("error" in parsed) return { error: parsed.error }

  // A plain UPDATE: the row (and its id) is edited in place, never re-created.
  const { error } = await supabaseAdmin.from("products").update(parsed.fields).eq("id", productId)
  if (error) return { error: friendlyDbError(error) }

  const syncError = await syncImagesAndVariants(productId, formData)
  if (syncError) return { error: `Your product details were saved, but: ${syncError}` }

  // Tell people waiting on this plant (back in stock) or who wishlisted it (back in stock / price drop).
  // A failure here must never undo or block the save.
  try {
    await afterProductSaved(productId, { price: Number(existing.price), stock_status: String(existing.stock_status) })
  } catch (alertError) {
    console.error("Stock/price alerts failed:", alertError)
  }

  revalidatePath("/admin/products")
  revalidateStorefront()
  redirect("/admin/products")
}

// Deletes one product and its photo files. No revalidating or redirecting, so the single and bulk deletes can share it.
async function removeProduct(productId: string): Promise<{ error: string; inOrders: boolean } | null> {
  const { data: images } = await supabaseAdmin.from("product_images").select("url").eq("product_id", productId)
  const { error } = await supabaseAdmin.from("products").delete().eq("id", productId)
  if (error) return { error: error.message, inOrders: error.code === "23503" }
  // product_images rows cascade-delete with the product; now drop their files from R2.
  await deleteUnreferencedProductImages((images ?? []).map((i) => i.url as string))
  return null
}

export async function deleteProduct(productId: string): Promise<ProductActionResult> {
  await requireAdmin()
  const failed = await removeProduct(productId)
  if (failed) {
    return {
      error: failed.inOrders
        ? "This product appears in past orders (or stock records), so it can't be deleted without breaking your order history. Edit it and untick “Published” to hide it from the shop instead."
        : failed.error,
    }
  }
  revalidatePath("/admin/products")
  revalidateStorefront()
  redirect("/admin/products")
}

// "Delete selected" on the products list. Products that appear in past orders are kept and reported by name.
export async function deleteProducts(ids: string[]): Promise<BulkDeleteResult> {
  await requireAdmin()
  const clean = cleanBulkIds(ids)
  if (!clean) return BAD_BULK_REQUEST

  const { data: named } = await supabaseAdmin.from("products").select("id, name").in("id", clean)
  const nameOf = new Map((named ?? []).map((p) => [p.id as string, p.name as string]))

  const result: BulkDeleteResult = { deleted: 0, failures: [] }
  for (const id of clean) {
    const failed = await removeProduct(id)
    if (!failed) result.deleted += 1
    else {
      const name = nameOf.get(id) ?? "A product"
      result.failures.push(
        failed.inOrders ? `${name} is in past orders, so it was kept. Unpublish it instead.` : `${name}: ${failed.error}`
      )
    }
  }

  if (result.deleted > 0) {
    revalidatePath("/admin/products")
    revalidateStorefront()
  }
  return result
}

// One-click publish/unpublish from the products list. Mirrors the form's rule: publishing an
// already-published product keeps its original published_at (the "New" badge counts from it).
export async function setProductPublished(productId: string, published: boolean): Promise<ProductActionResult> {
  await requireAdmin()

  const { data: existing, error: readError } = await supabaseAdmin
    .from("products")
    .select("published_at")
    .eq("id", productId)
    .maybeSingle()
  if (readError) return { error: readError.message }
  if (!existing) return { error: "This product no longer exists. It may have been deleted." }

  const publishedAt = published ? ((existing.published_at as string | null) ?? new Date().toISOString()) : null
  const { error } = await supabaseAdmin.from("products").update({ published_at: publishedAt }).eq("id", productId)
  if (error) return { error: error.message }

  revalidatePath("/admin/products")
  revalidateStorefront()
}

// Attaches already-uploaded photos to a product straight from the products list (no edit form).
// Photos are only ever appended: the first one becomes the primary image when the product has
// none, and existing photos are never touched or deleted.
export async function addProductPhotos(productId: string, urls: string[]): Promise<ProductActionResult> {
  await requireAdmin()

  const wanted = Array.from(new Set(urls.map((u) => u.trim()).filter(Boolean)))
  if (wanted.length === 0) return { error: "No photo was uploaded." }
  if (wanted.length > 10) return { error: "Add at most 10 photos at a time." }
  if (wanted.some((u) => !isAllowedImageUrl(u))) {
    return { error: "One of the photos isn't from an allowed image host. Upload it with the photo button again." }
  }

  const { data: existing, error: readError } = await supabaseAdmin
    .from("product_images")
    .select("url, sort_order")
    .eq("product_id", productId)
  if (readError) return { error: `Could not read the product's photos: ${readError.message}` }

  const have = new Set((existing ?? []).map((r) => r.url as string))
  const fresh = wanted.filter((u) => !have.has(u))
  if (fresh.length === 0) return undefined

  const nextOrder = Math.max(-1, ...(existing ?? []).map((r) => (r.sort_order as number | null) ?? 0)) + 1
  const hasPhotos = (existing ?? []).length > 0
  const { error } = await supabaseAdmin.from("product_images").insert(
    fresh.map((url, i) => ({
      product_id: productId,
      url,
      alt_text: "",
      sort_order: nextOrder + i,
      is_primary: !hasPhotos && i === 0,
    }))
  )
  if (error) {
    return { error: error.code === "23503" ? "This product no longer exists. It may have been deleted." : `Saving the photo failed: ${error.message}` }
  }

  revalidatePath("/admin/products")
  revalidateStorefront()
}

// Sets one variant's own photo straight from the products list (the per-variant photo overlay). The photo
// has already been uploaded (converted to AVIF and stored in R2); this attaches its URL to the variant.
// A variant that already has a photo gets it replaced in place (same row, same position among the product's
// photos) and the old file is deleted from R2 unless something else still points at it. A variant with
// several photos (added in the product form) only has its first one replaced.
export async function setVariantPhoto(productId: string, variantId: string, url: string): Promise<ProductActionResult> {
  await requireAdmin()

  const photoUrl = (url ?? "").trim()
  if (!photoUrl) return { error: "No photo was uploaded." }
  if (!isAllowedImageUrl(photoUrl)) {
    return { error: "That photo isn't from an allowed image host. Upload it with the photo button again." }
  }

  const { data: variant, error: variantError } = await supabaseAdmin
    .from("product_variants")
    .select("id, name, is_active")
    .eq("id", variantId)
    .eq("product_id", productId)
    .maybeSingle()
  if (variantError) return { error: `Could not read the variant: ${variantError.message}` }
  if (!variant || variant.is_active === false) {
    return { error: "This variant no longer exists. Reload the page and try again." }
  }

  const { data: existing, error: readError } = await supabaseAdmin
    .from("product_images")
    .select("id, url, sort_order, variant_id")
    .eq("product_id", productId)
  if (readError) return { error: `Could not read the product's photos: ${readError.message}` }

  const current = (existing ?? [])
    .filter((row) => row.variant_id === variantId)
    .sort((a, b) => ((a.sort_order as number | null) ?? 0) - ((b.sort_order as number | null) ?? 0))[0]
  if (current && current.url === photoUrl) return undefined

  const writeError = current
    ? (await supabaseAdmin.from("product_images").update({ url: photoUrl }).eq("id", current.id)).error
    : (
        await supabaseAdmin.from("product_images").insert({
          product_id: productId,
          variant_id: variantId,
          url: photoUrl,
          alt_text: variant.name as string,
          sort_order: Math.max(-1, ...(existing ?? []).map((r) => (r.sort_order as number | null) ?? 0)) + 1,
          is_primary: false,
        })
      ).error
  if (writeError) {
    // The new file is already in R2 but nothing points at it: drop it rather than leave an orphan.
    await deleteUnreferencedProductImages([photoUrl])
    return { error: `Saving the photo failed: ${writeError.message}` }
  }

  // The replaced photo's file goes too, unless another photo or record still uses that same file.
  if (current) await deleteUnreferencedProductImages([current.url as string])

  revalidatePath("/admin/products")
  revalidateStorefront()
}

type StockStatus = "in_stock" | "low_stock" | "out_of_stock"
function stockStatusFor(stock: number, threshold: number): StockStatus {
  if (stock <= 0) return "out_of_stock"
  return stock <= threshold ? "low_stock" : "in_stock"
}

// Images and variants are submitted as repeatable rows (same field name, FormData.getAll
// reads them in order). Both are SYNCED against what's already stored -- existing rows are
// updated in place, only genuinely new ones are inserted, only removed ones are deleted --
// instead of wiping and recreating every row on each save. That keeps row ids stable
// (carts, orders and wishlists point at variant ids) and avoids needless writes.
// Returns an error message, or null on success.
async function syncImagesAndVariants(productId: string, formData: FormData): Promise<string | null> {
  // Variants go first: a photo can belong to a variant that is being created in this same save, so
  // its database id has to exist before the photo rows are written.
  const variants = await syncVariants(productId, formData)
  if ("error" in variants) return variants.error
  return syncImages(productId, formData, variants.idByKey)
}

async function syncImages(productId: string, formData: FormData, variantIdByKey: Map<string, string>): Promise<string | null> {
  const imageUrls = formData.getAll("image_url") as string[]
  const imageAlts = formData.getAll("image_alt") as string[]
  // Which variant each photo belongs to (a variant row key, "" = general) and whether it was flagged primary.
  const imageVariantKeys = formData.getAll("image_variant") as string[]
  const imagePrimaryFlags = formData.getAll("image_primary") as string[]

  // Drop blank and duplicate rows before numbering. A photo whose variant is unknown (removed, or unnamed
  // and so not saved) is treated as general rather than lost.
  const seen = new Set<string>()
  const desired: Array<{ url: string; alt_text: string; variant_id: string | null; flagged: boolean }> = []
  imageUrls.forEach((raw, i) => {
    const url = raw.trim()
    if (!url || seen.has(url)) return
    seen.add(url)
    const variantKey = (imageVariantKeys[i] ?? "").trim()
    desired.push({
      url,
      alt_text: imageAlts[i] ?? "",
      variant_id: variantKey ? (variantIdByKey.get(variantKey) ?? null) : null,
      flagged: imagePrimaryFlags[i] === "1",
    })
  })

  // Exactly one primary, and only ever among general photos (the shop card reads it). See choosePrimaryUrl.
  const primaryUrl = choosePrimaryUrl(desired)

  const { data: existing, error: readError } = await supabaseAdmin
    .from("product_images")
    .select("id, url, alt_text, sort_order, is_primary, variant_id")
    .eq("product_id", productId)
  if (readError) return `Could not read the existing images: ${readError.message}`

  const rowByUrl = new Map<string, NonNullable<typeof existing>[number]>()
  for (const row of existing ?? []) if (!rowByUrl.has(row.url as string)) rowByUrl.set(row.url as string, row)

  const keptIds = new Set<string>()
  const toInsert: Array<Record<string, unknown>> = []
  const toUpdate: Array<{ id: string; values: Record<string, unknown> }> = []

  desired.forEach((image, index) => {
    const row = rowByUrl.get(image.url)
    const isPrimary = image.url === primaryUrl
    if (!row) {
      toInsert.push({ product_id: productId, url: image.url, alt_text: image.alt_text, sort_order: index, is_primary: isPrimary, variant_id: image.variant_id })
      return
    }
    keptIds.add(row.id as string)
    if (
      row.sort_order !== index ||
      row.is_primary !== isPrimary ||
      (row.alt_text ?? "") !== image.alt_text ||
      ((row.variant_id as string | null) ?? null) !== image.variant_id
    ) {
      toUpdate.push({ id: row.id as string, values: { sort_order: index, is_primary: isPrimary, alt_text: image.alt_text, variant_id: image.variant_id } })
    }
  })

  // New rows first, removals last: a failure can never leave a product with no images.
  if (toInsert.length > 0) {
    const { error } = await supabaseAdmin.from("product_images").insert(toInsert)
    if (error) return `Saving images failed: ${error.message}`
  }
  for (const { id, values } of toUpdate) {
    const { error } = await supabaseAdmin.from("product_images").update(values).eq("id", id)
    if (error) return `Saving images failed: ${error.message}`
  }

  const removed = (existing ?? []).filter((row) => !keptIds.has(row.id as string))
  if (removed.length > 0) {
    const { error } = await supabaseAdmin
      .from("product_images")
      .delete()
      .in("id", removed.map((r) => r.id as string))
    if (error) return `Removing old images failed: ${error.message}`
    // Photos that were replaced or removed: delete their files from Cloudflare R2 too
    // (unless another product/category/etc. still uses the same file).
    await deleteUnreferencedProductImages(removed.map((r) => r.url as string))
  }
  return null
}

async function syncVariants(productId: string, formData: FormData): Promise<{ error: string } | { idByKey: Map<string, string> }> {
  const ids = formData.getAll("variant_id") as string[]
  // The form's own key for each variant row, so photo rows can point at a variant that has no id yet.
  const keys = formData.getAll("variant_key") as string[]
  const names = formData.getAll("variant_name") as string[]
  const skus = formData.getAll("variant_sku") as string[]
  const prices = formData.getAll("variant_price") as string[]
  const stocks = formData.getAll("variant_stock") as string[]
  const productSku = String(formData.get("sku") ?? "").trim()
  const threshold = Number(formData.get("low_stock_threshold") || 10)

  const rows = names
    .map((name, i) => {
      const stock = Number(stocks[i] || 0)
      return {
        id: (ids[i] ?? "").trim(),
        key: (keys[i] ?? "").trim(),
        name: name.trim(),
        sku: skus[i]?.trim() || `${productSku}-${i + 1}`,
        price: Number(prices[i] || 0),
        stock_count: stock,
        stock_status: stockStatusFor(stock, threshold),
        sort_order: i,
        is_default: i === 0,
        is_active: true,
      }
    })
    .filter((row) => row.name.length > 0)
    .map((row, i) => ({ ...row, sort_order: i, is_default: i === 0 }))

  if (rows.some((r) => !Number.isFinite(r.price) || r.price < 0 || !Number.isFinite(r.stock_count) || r.stock_count < 0)) {
    return { error: "Variant prices and stock must be valid, non-negative numbers." }
  }
  if (new Set(rows.map((r) => r.sku)).size !== rows.length) {
    return { error: "Two variants have the same SKU. Every variant needs its own unique SKU." }
  }

  const { data: existing, error: readError } = await supabaseAdmin
    .from("product_variants")
    .select("id")
    .eq("product_id", productId)
  if (readError) return { error: `Could not read the existing variants: ${readError.message}` }
  const existingIds = new Set((existing ?? []).map((v) => v.id as string))

  const keptIds = new Set<string>()
  const idByKey = new Map<string, string>()
  for (const { id, key, ...values } of rows) {
    if (id && existingIds.has(id)) {
      keptIds.add(id)
      if (key) idByKey.set(key, id)
      const { error } = await supabaseAdmin.from("product_variants").update(values).eq("id", id).eq("product_id", productId)
      if (error) return { error: `Saving variant “${values.name}” failed: ${friendlyDbError(error)}` }
    } else {
      const { data: created, error } = await supabaseAdmin.from("product_variants").insert({ ...values, product_id: productId }).select("id").single()
      if (error) return { error: `Saving variant “${values.name}” failed: ${friendlyDbError(error)}` }
      if (key) idByKey.set(key, created.id as string)
    }
  }

  // Variants removed in the form. A variant that appears in past orders can't be deleted
  // (order history points at it), so it is retired instead: hidden from the shop, stock zeroed.
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
  return { idByKey }
}
