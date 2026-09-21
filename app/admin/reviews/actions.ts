"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { BAD_BULK_REQUEST, cleanBulkIds, type BulkDeleteResult } from "@/lib/admin-bulk"

function refresh(slug?: string | null) {
  revalidatePath("/admin/reviews")
  revalidatePath("/reviews")
  if (slug) revalidatePath(`/shop/product/${slug}`)
}

async function slugFor(reviewId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from("reviews").select("product:products(slug)").eq("id", reviewId).maybeSingle()
  return (data?.product as unknown as { slug: string } | null)?.slug ?? null
}

// Hidden reviews vanish from the product page, the reviews page and the star average; the customer is not told.
export async function setReviewHidden(reviewId: string, hidden: boolean): Promise<void> {
  await requireAdmin()
  const slug = await slugFor(reviewId)
  const { error } = await supabaseAdmin.from("reviews").update({ is_hidden: hidden }).eq("id", reviewId)
  if (error) throw new Error(error.message)
  refresh(slug)
}

export async function deleteReviews(ids: string[]): Promise<BulkDeleteResult> {
  await requireAdmin()
  const clean = cleanBulkIds(ids)
  if (!clean) return BAD_BULK_REQUEST

  // Product pages show their reviews, so each affected page must be refreshed too.
  const { data: products } = await supabaseAdmin.from("reviews").select("product:products(slug)").in("id", clean)
  const slugs = new Set((products ?? []).map((r) => (r.product as unknown as { slug: string } | null)?.slug).filter(Boolean) as string[])

  const { data, error } = await supabaseAdmin.from("reviews").delete().in("id", clean).select("id")
  if (error) return { deleted: 0, failures: [], error: error.message }

  refresh()
  for (const slug of slugs) revalidatePath(`/shop/product/${slug}`)
  return { deleted: data?.length ?? 0, failures: [] }
}

export async function deleteReview(reviewId: string): Promise<{ error?: string } | void> {
  await requireAdmin()
  const slug = await slugFor(reviewId)
  const { error } = await supabaseAdmin.from("reviews").delete().eq("id", reviewId)
  if (error) return { error: error.message }
  refresh(slug)
}
