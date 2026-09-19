import type { Metadata } from "next"
import { ReviewsPageClient } from "./reviews-client"

export const metadata: Metadata = {
  title: "Customer Reviews & Testimonials",
  description: "See what Karachi plant parents say about Muffin Greenhouse. Real reviews from customers who love our plants and service.",
}

export default function ReviewsPage() {
  return <ReviewsPageClient />
}
