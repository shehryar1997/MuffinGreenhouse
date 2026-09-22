"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/supabase/admin-client"
import { allowHit, callerIp } from "@/lib/db-rate-limit"
import { PUBLIC_BASE_URL } from "@/lib/r2"

export type PublicReviewResult = { error: string } | { ok: true }

export interface PublicReviewInput {
  rating: number
  body: string
  /** false = post anonymously */
  showName: boolean
  name: string
  imageUrl: string | null
  /** Honeypot: a field real visitors never see or fill. Non-empty means a bot filled every input. */
  website: string
}

// Open to anyone, no order required, so past customers from before the website existed can leave a review too.
// Unlike submitReview (app/orders/[token]/review-actions.ts), there's no order token proving who they are, so
// every review here is held back (is_hidden = true) until an admin approves it in Admin -> Reviews. A review
// from a real, shipped order still goes live immediately through the order page instead.
export async function submitPublicReview(productId: string, input: PublicReviewInput): Promise<PublicReviewResult> {
  // A filled honeypot means a bot filled in every field; report success without saving anything.
  if (input.website?.trim()) return { ok: true }

  if (!(await allowHit(`public-review:${await callerIp()}`, 5, 60 * 60))) {
    return { error: "Too many reviews from this connection. Please try again later." }
  }

  const rating = Math.round(Number(input.rating))
  if (!(rating >= 1 && rating <= 5)) return { error: "Choose a star rating." }
  const body = String(input.body ?? "").trim()
  if (body.length < 10) return { error: "Tell us a little more (at least 10 characters)." }
  if (body.length > 1500) return { error: "Your review is too long (1,500 characters max)." }
  const name = String(input.name ?? "").trim()
  if (input.showName && (name.length < 2 || name.length > 60)) return { error: "Enter the name to show, or choose to post anonymously." }
  const imageUrl = input.imageUrl?.trim() || null
  if (imageUrl && !imageUrl.startsWith(`${PUBLIC_BASE_URL}/reviews/`)) return { error: "That photo couldn't be attached. Try uploading it again." }

  const { data: product } = await supabaseAdmin.from("products").select("id, slug").eq("id", productId).maybeSingle()
  if (!product) return { error: "That product no longer exists." }

  const { error } = await supabaseAdmin.from("reviews").insert({
    product_id: product.id,
    rating,
    body,
    display_name: input.showName ? name : null,
    image_url: imageUrl,
    verified_purchase: false,
    // Held for admin approval: nothing here proves who posted it (see the note above).
    is_hidden: true,
  })
  if (error) return { error: "Couldn't save your review. Please try again." }

  revalidatePath("/admin/reviews")
  if (product.slug) revalidatePath(`/shop/product/${product.slug}`)
  return { ok: true }
}
