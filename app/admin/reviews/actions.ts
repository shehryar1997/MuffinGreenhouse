"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"

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

export async function deleteReview(reviewId: string): Promise<{ error?: string } | void> {
  await requireAdmin()
  const slug = await slugFor(reviewId)
  const { error } = await supabaseAdmin.from("reviews").delete().eq("id", reviewId)
  if (error) return { error: error.message }
  refresh(slug)
}
