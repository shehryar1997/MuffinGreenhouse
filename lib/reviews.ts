// SERVER-ONLY. Product review reads. Two ways to leave a review: a shipped order (verified purchase, goes live
// immediately) or the open "Write a review" form on the product page (no order needed, held for admin approval
// first). An admin can hide any review either way.
import { unstable_cache } from "next/cache"
import { supabaseAdmin } from "@/supabase/admin-client"
import { REVIEWS_CACHE_TAG } from "@/lib/cache-tags"

export interface ProductReview {
  id: string
  rating: number
  body: string
  /** null = the customer posted anonymously */
  name: string | null
  imageUrl: string | null
  createdAt: string
  verified: boolean
}

async function loadProductReviews(productId: string): Promise<{ reviews: ProductReview[]; average: number; count: number }> {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("id, rating, body, display_name, image_url, created_at, verified_purchase")
    .eq("product_id", productId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) {
    console.error("Error loading reviews:", error)
    return { reviews: [], average: 0, count: 0 }
  }
  const reviews = (data ?? []).map((r) => ({
    id: r.id as string,
    rating: r.rating as number,
    body: r.body as string,
    name: (r.display_name as string | null) ?? null,
    imageUrl: (r.image_url as string | null) ?? null,
    createdAt: r.created_at as string,
    verified: !!r.verified_purchase,
  }))
  const count = reviews.length
  const average = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0
  return { reviews, average, count }
}

// Cached so product pages can be served from the cache instead of rendering on every visit. Any review change
// (a new review, an approval, a hide or a delete) expires REVIEWS_CACHE_TAG.
export const getProductReviews = unstable_cache(loadProductReviews, ["product-reviews"], { tags: [REVIEWS_CACHE_TAG], revalidate: 300 })
