"use client"

import { motion } from "framer-motion"
import { Star, CheckCircle } from "lucide-react"
import { mockReviews, mockProducts } from "@/data/mock-products"

export default function ReviewsPage() {
  const avgRating = mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length
  const totalReviews = mockReviews.length

  return (
    <div className="bg-cream-100 min-h-screen py-20">
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

        <div className="grid md:grid-cols-2 gap-6">
          {mockReviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-forest-200/50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-1 text-sprout-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-4 h-4 ${star <= review.rating ? "fill-current" : ""}`} />
                  ))}
                </div>
                {review.verifiedPurchase && (
                  <span className="flex items-center gap-1 text-xs text-forest-500">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-forest-800 mb-4">&quot;{review.text}&quot;</p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-forest-900">{review.customerName}</span>
                <span className="text-forest-500">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
