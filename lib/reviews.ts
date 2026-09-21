// SERVER-ONLY. Product review reads. Only customers with a shipped order can write one (see the order page),
// so every review counts as a verified purchase. An admin can hide any review.
import { supabaseAdmin } from "@/supabase/admin-client"

export interface ProductReview {
  id: string
  rating: number
  body: string
  /** null = the customer posted anonymously */
  name: string | null
  imageUrl: string | null
  createdAt: string
}

export async function getProductReviews(productId: string): Promise<{ reviews: ProductReview[]; average: number; count: number }> {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("id, rating, body, display_name, image_url, created_at")
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
  }))
  const count = reviews.length
  const average = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0
  return { reviews, average, count }
}
