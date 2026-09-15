import { Star } from "lucide-react"
import { mockReviews } from "@/lib/data/products"
import ReviewsGrid from "./reviews-grid"

export default function ReviewsPage() {
  const avgRating = mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length
  const totalReviews = mockReviews.length

  return (
    <div className="bg-cream-100 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-forest-500 mb-2">Trust</p>
          <h1 className="font-serif text-display text-forest-900 mb-4">Customer Reviews</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="flex text-sprout-500">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`w-6 h-6 ${i <= Math.round(avgRating) ? "fill-current" : ""}`} />
              ))}
            </div>
            <span className="font-serif text-2xl">{avgRating.toFixed(1)}</span>
            <span className="text-forest-500">({totalReviews} reviews)</span>
          </div>
        </div>

        <ReviewsGrid reviews={mockReviews} />
      </div>
    </div>
  )
}
