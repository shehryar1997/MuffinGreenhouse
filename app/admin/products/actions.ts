"use server"

import { supabaseAdmin } from "@/supabase/admin-client"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function getFormLookups() {
  const [{ data: categories }, { data: useCaseTags }, { data: moodTags }] = await Promise.all([
    supabaseAdmin.from("categories").select("name").order("name"),
    supabaseAdmin.from("use_case_tags").select("name").order("name"),
    supabaseAdmin.from("mood_tags").select("name").order("name"),
  ])
  return {
    categories: (categories ?? []).map((c) => c.name as string),
    useCaseTags: (useCaseTags ?? []).map((t) => t.name as string),
    moodTags: (moodTags ?? []).map((t) => t.name as string),
  }
}

function parseProductFields(formData: FormData) {
  return {
    sku: formData.get("sku") as string,
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    description: formData.get("description") as string,
    short_description: (formData.get("short_description") as string) || null,
    // category_id/category_slug auto-resolve from category_name via the
    // trg_sync_product_category trigger -- we only ever send the name here.
    category_name: formData.get("category_name") as string,
    price: Number(formData.get("price")),
    compare_at_price: formData.get("compare_at_price") ? Number(formData.get("compare_at_price")) : null,
    currency: "PKR",
    stock_count: Number(formData.get("stock_count") || 0),
    low_stock_threshold: Number(formData.get("low_stock_threshold") || 10),
    difficulty: formData.get("difficulty") as string,
    light_requirement: formData.get("light_requirement") as string,
    water_requirement: formData.get("water_requirement") as string,
    size: formData.get("size") as string,
    is_new_arrival: formData.get("is_new_arrival") === "on",
    is_pet_safe: formData.get("is_pet_safe") === "on",
    is_featured: formData.get("is_featured") === "on",
    published_at: formData.get("published") === "on" ? new Date().toISOString() : null,
    meta_title: (formData.get("meta_title") as string) || null,
    meta_description: (formData.get("meta_description") as string) || null,
    light: (formData.get("light") as string) || null,
    water: (formData.get("water") as string) || null,
    humidity: (formData.get("humidity") as string) || null,
    temperature: (formData.get("temperature") as string) || null,
    soil: (formData.get("soil") as string) || null,
    fertilizer: (formData.get("fertilizer") as string) || null,
    toxicity: (formData.get("toxicity") as string) || null,
    light_summary: (formData.get("light_summary") as string) || null,
    water_summary: (formData.get("water_summary") as string) || null,
    pet_safe_note: (formData.get("pet_safe_note") as string) || null,
    // trg_validate_product_tags rejects any value not already in
    // use_case_tags/mood_tags -- the form only offers valid checkboxes,
    // so this should always pass, but the DB guard stays as a backstop.
    use_case_tags: formData.getAll("use_case_tags") as string[],
    mood_tags: formData.getAll("mood_tags") as string[],
    // Shipping dimensions (optional, used for shipping cost calculation)
    box_height_cm: formData.get("box_height_cm") ? Number(formData.get("box_height_cm")) : null,
    box_width_cm: formData.get("box_width_cm") ? Number(formData.get("box_width_cm")) : null,
    box_breadth_cm: formData.get("box_breadth_cm") ? Number(formData.get("box_breadth_cm")) : null,
    weight_kg: formData.get("weight_kg") ? Number(formData.get("weight_kg")) : null,
  }
}

export async function createProduct(formData: FormData) {
  const fields = parseProductFields(formData)
  const { data, error } = await supabaseAdmin.from("products").insert(fields).select("id").single()

  if (error) {
    throw new Error(error.message)
  }

  await syncImagesAndVariants(data.id, formData)

  revalidatePath("/admin/products")
  redirect("/admin/products")
}

export async function updateProduct(productId: string, formData: FormData) {
  const fields = parseProductFields(formData)
  const { error } = await supabaseAdmin.from("products").update(fields).eq("id", productId)

  if (error) {
    throw new Error(error.message)
  }

  await syncImagesAndVariants(productId, formData)

  revalidatePath("/admin/products")
  redirect("/admin/products")
}

export async function deleteProduct(productId: string) {
  const { error } = await supabaseAdmin.from("products").delete().eq("id", productId)
  if (error) {
    throw new Error(error.message)
  }
  revalidatePath("/admin/products")
  redirect("/admin/products")
}

// Images and variants are submitted as repeatable rows (same field name,
// FormData.getAll reads them in order). Wipe-and-reinsert per save, same
// pattern the old n8n sync used -- row counts per product are always small.
async function syncImagesAndVariants(productId: string, formData: FormData) {
  const imageUrls = formData.getAll("image_url") as string[]
  const imageAlts = formData.getAll("image_alt") as string[]

  await supabaseAdmin.from("product_images").delete().eq("product_id", productId)
  const imageRows = imageUrls
    .map((url, i) => ({
      url: url.trim(),
      alt_text: imageAlts[i] || "",
      product_id: productId,
      sort_order: i,
      is_primary: i === 0,
    }))
    .filter((row) => row.url.length > 0)
  if (imageRows.length > 0) {
    await supabaseAdmin.from("product_images").insert(imageRows)
  }

  const variantNames = formData.getAll("variant_name") as string[]
  const variantSkus = formData.getAll("variant_sku") as string[]
  const variantPrices = formData.getAll("variant_price") as string[]
  const variantStocks = formData.getAll("variant_stock") as string[]

  await supabaseAdmin.from("product_variants").delete().eq("product_id", productId)
  const variantRows = variantNames
    .map((name, i) => ({
      product_id: productId,
      name: name.trim(),
      sku: variantSkus[i]?.trim() || `${formData.get("sku")}-${i + 1}`,
      price: Number(variantPrices[i] || 0),
      stock_count: Number(variantStocks[i] || 0),
      sort_order: i,
      is_default: i === 0,
      is_active: true,
    }))
    .filter((row) => row.name.length > 0)
  if (variantRows.length > 0) {
    await supabaseAdmin.from("product_variants").insert(variantRows)
  }
}
