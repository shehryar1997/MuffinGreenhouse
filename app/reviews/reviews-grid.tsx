"use client"

import { motion } from "framer-motion"
import { Star, CheckCircle } from "lucide-react"
import { Review } from "@/types"

interface ReviewsGridProps {
  reviews: Review[]
}

export default function ReviewsGrid({ reviews }: ReviewsGridProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-forest-200 rounded-2xl">
        <p className="text-forest-600 mb-1">No reviews yet.</p>
        <p className="text-forest-500 text-sm">Be the first to tell us how your plant is doing.</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {reviews.map((review, i) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-surface rounded-2xl p-6 border border-forest-200/50"
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
  )
}
