"use client"

import { Review } from "@/types"
import ReviewsGrid from "./reviews-grid"

export function ReviewsPageClient({ reviews }: { reviews: Review[] }) {
  const totalReviews = reviews.length
  const avgRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0

  return (
    <div className="bg-cream-100 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-forest-500 mb-2">Trust</p>
          <h1 className="font-serif text-display text-forest-900 mb-4">Customer Reviews</h1>
          {totalReviews > 0 && (
            <div className="flex items-center justify-center gap-2">
              <span className="font-serif text-2xl">{avgRating.toFixed(1)}</span>
              <span className="text-forest-500">({totalReviews} reviews)</span>
            </div>
          )}
        </div>

        <ReviewsGrid reviews={reviews} />
      </div>
    </div>
  )
}