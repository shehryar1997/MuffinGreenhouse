import type { Metadata } from "next"
import { supabaseAdmin } from "@/supabase/admin-client"
import type { Review } from "@/types"
import { ReviewsPageClient } from "./reviews-client"

export const revalidate = 300

export const metadata: Metadata = {
  alternates: { canonical: "/reviews" },
  title: "Customer Reviews & Testimonials",
  description: "See what Karachi plant parents say about Muffin Greenhouse. Real reviews from customers who love our plants and service.",
}

export default async function ReviewsPage() {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("id, product_id, rating, body, display_name, image_url, created_at, product:products(name)")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(60)
  if (error) console.error("Error loading reviews:", error)

  const reviews: Review[] = (data ?? []).map((r) => ({
    id: r.id as string,
    productId: r.product_id as string,
    customerName: (r.display_name as string | null) ?? "Anonymous",
    rating: r.rating as number,
    text: r.body as string,
    verifiedPurchase: true,
    createdAt: r.created_at as string,
    productName: (r.product as unknown as { name: string } | null)?.name,
    imageUrl: (r.image_url as string | null) ?? null,
  }))
  return <ReviewsPageClient reviews={reviews} />
}
