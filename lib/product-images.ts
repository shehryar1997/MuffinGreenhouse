// Server-only helpers that keep Cloudflare R2 in step with the database: a photo file
// is deleted from R2 once nothing in the database points at it any more.
import { supabaseAdmin } from "@/supabase/admin-client"
import { deleteR2Keys, productKeyFromUrl, urlVariantsForKey } from "@/lib/r2"

// Every table/column that can hold an image URL. A file is only deleted from R2
// once none of these still reference it.
export const IMAGE_URL_COLUMNS = [
  ["product_images", "url"],
  ["product_images", "thumbnail_url"],
  ["product_images", "medium_url"],
  ["product_images", "large_url"],
  ["product_variants", "image_url"],
  ["categories", "image_url"],
  ["events", "image_url"],
  ["journal_posts", "cover_image_url"],
] as const

/**
 * Deletes the R2 files behind `candidateUrls` that are no longer referenced anywhere.
 * Best-effort: if a reference check fails we keep the files (an orphan is harmless,
 * deleting an image that's still in use is not).
 */
export async function deleteUnreferencedProductImages(candidateUrls: string[]): Promise<number> {
  const keys = Array.from(new Set(candidateUrls.map(productKeyFromUrl).filter((k): k is string => !!k)))
  if (keys.length === 0) return 0

  // A file may be stored under either public host, so check both spellings of each key.
  const urls = keys.flatMap(urlVariantsForKey)
  const stillUsed = new Set<string>()
  for (const [table, column] of IMAGE_URL_COLUMNS) {
    const { data, error } = await supabaseAdmin.from(table).select(column).in(column, urls)
    if (error) {
      console.error(`[images] reference check failed on ${table}.${column}; keeping files:`, error.message)
      return 0
    }
    for (const row of (data ?? []) as unknown as Record<string, string | null>[]) {
      const key = row[column] ? productKeyFromUrl(row[column] as string) : null
      if (key) stillUsed.add(key)
    }
  }
  return deleteR2Keys(keys.filter((k) => !stillUsed.has(k)))
}

/** Keys of every product-folder file the database references, or null if any lookup failed. */
export async function loadReferencedImageKeys(): Promise<Set<string> | null> {
  const referenced = new Set<string>()
  for (const [table, column] of IMAGE_URL_COLUMNS) {
    const { data, error } = await supabaseAdmin.from(table).select(column)
    if (error) {
      console.error(`[images] could not read ${table}.${column}:`, error.message)
      return null
    }
    for (const row of (data ?? []) as unknown as Record<string, string | null>[]) {
      const key = row[column] ? productKeyFromUrl(row[column] as string) : null
      if (key) referenced.add(key)
    }
  }
  return referenced
}
