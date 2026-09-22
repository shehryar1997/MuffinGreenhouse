"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { CATEGORIES_CACHE_TAG } from "@/lib/cache-tags"

export type CategoryActionResult = { error: string } | undefined

// Saves a category's shop copy and search listing. Names and web addresses stay fixed: menus, delivery rules and
// links point at them (see config/nav.config.ts and lib/product-categories.ts).
export async function updateCategory(slug: string, formData: FormData): Promise<CategoryActionResult> {
  await requireAdmin()
  const text = (name: string, max: number) => String(formData.get(name) ?? "").trim().slice(0, max)
  const values = {
    tagline: text("tagline", 120) || null,
    description: text("description", 400) || null,
    intro: text("intro", 20_000) || null,
    meta_title: text("meta_title", 70) || null,
    meta_description: text("meta_description", 170) || null,
  }
  if (!values.description) return { error: "Add a short description: it shows under the category name." }

  const { error } = await supabaseAdmin.from("categories").update(values).eq("slug", slug)
  if (error) return { error: error.message }

  revalidateTag(CATEGORIES_CACHE_TAG, { expire: 0 })
  revalidatePath(`/shop/${slug}`)
  revalidatePath("/shop/tools-equipment")
  revalidatePath("/admin/categories")
  redirect("/admin/categories?saved=1")
}
