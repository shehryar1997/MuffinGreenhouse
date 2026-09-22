// Category copy (tagline, description, buying-guide intro, search listing), edited in Admin > Categories.
// Server only: cached under CATEGORIES_CACHE_TAG, which the admin category save expires.
import { unstable_cache } from "next/cache"
import { supabase } from "@/supabase/client"
import { categoryMeta } from "@/data/mock-products"
import { CATEGORIES_CACHE_TAG } from "@/lib/cache-tags"

export interface CategoryCopy {
  slug: string
  name: string
  title: string
  tagline: string
  description: string
  /** Buying-guide text shown under the product grid (journal format, see lib/journal-markdown.ts). */
  intro: string | null
  metaTitle: string | null
  metaDescription: string | null
}

async function loadCategoryCopy(slug: string): Promise<CategoryCopy | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name, description, tagline, intro, meta_title, meta_description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()
  if (error) console.error("Could not load category copy:", error.message)

  // The code copy is the fallback, so a page still has a heading and text if the database is unreachable.
  const fallback = categoryMeta[slug]
  if (!data && !fallback) return null
  return {
    slug,
    name: (data?.name as string | undefined) ?? fallback?.title ?? slug,
    title: (data?.name as string | undefined) ?? fallback?.title ?? slug,
    tagline: (data?.tagline as string | null) || fallback?.tagline || "",
    description: (data?.description as string | null) || fallback?.description || "",
    intro: ((data?.intro as string | null) ?? "").trim() || null,
    metaTitle: ((data?.meta_title as string | null) ?? "").trim() || null,
    metaDescription: ((data?.meta_description as string | null) ?? "").trim() || null,
  }
}

export const getCategoryCopy = unstable_cache(loadCategoryCopy, ["category-copy"], { tags: [CATEGORIES_CACHE_TAG], revalidate: 3600 })
