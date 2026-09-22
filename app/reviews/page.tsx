import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { unstable_cache } from "next/cache"
import { supabaseAdmin } from "@/supabase/admin-client"
import type { Review } from "@/types"
import { REVIEWS_CACHE_TAG } from "@/lib/cache-tags"
import { ReviewsPageClient } from "./reviews-client"

export const revalidate = 300

// Cached (the admin client skips Next's fetch cache, which made this page render on every visit); any review
// change expires REVIEWS_CACHE_TAG.
const loadReviews = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("id, product_id, rating, body, display_name, image_url, created_at, verified_purchase, product:products(name)")
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(60)
    if (error) console.error("Error loading reviews:", error)
    return data ?? []
  },
  ["reviews-page"],
  { tags: [REVIEWS_CACHE_TAG], revalidate: 300 }
)

export async function generateMetadata(): Promise<Metadata> {
  const rows = await loadReviews()
  // "No reviews yet" is a thin page: kept out of search until the first review is approved.
  return pageMetadata({ title: "Customer Reviews", description: "What Karachi plant parents say about Muffin Plants. Real reviews from verified customers.", path: "/reviews", noindex: rows.length === 0 })
}

export default async function ReviewsPage() {
  const data = await loadReviews()

  const reviews: Review[] = data.map((r) => ({
    id: r.id as string,
    productId: r.product_id as string,
    customerName: (r.display_name as string | null) ?? "Anonymous",
    rating: r.rating as number,
    text: r.body as string,
    verifiedPurchase: !!r.verified_purchase,
    createdAt: r.created_at as string,
    productName: (r.product as unknown as { name: string } | null)?.name,
    imageUrl: (r.image_url as string | null) ?? null,
  }))
  return <ReviewsPageClient reviews={reviews} />
}
