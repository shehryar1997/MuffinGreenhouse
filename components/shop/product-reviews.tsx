import Image from "next/image"
import { CheckCircle, Star } from "lucide-react"
import type { ProductReview } from "@/lib/reviews"
import { WriteReviewForm } from "./write-review-form"

function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex text-amber-500" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${className} ${n <= Math.round(value) ? "fill-current" : "text-forest-200"}`} aria-hidden="true" />
      ))}
    </span>
  )
}

export function ProductReviews({
  productId,
  productName,
  reviews,
  average,
  count,
}: {
  productId: string
  productName: string
  reviews: ProductReview[]
  average: number
  count: number
}) {
  return (
    <section aria-labelledby="reviews-heading" className="mt-16 border-t border-forest-200 pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 id="reviews-heading" className="font-serif text-2xl text-forest-900">Customer reviews</h2>
        {count > 0 && (
          <p className="flex items-center gap-2 text-sm text-forest-700">
            <Stars value={average} />
            <span className="font-medium">{average.toFixed(1)}</span>
            <span className="text-forest-500">({count} {count === 1 ? "review" : "reviews"})</span>
          </p>
        )}
      </div>

      {count === 0 ? (
        <p className="text-sm text-forest-600">No reviews yet. Be the first to tell others how it went.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-forest-200/60 bg-surface p-5">
              <div className="mb-2 flex items-center justify-between">
                <Stars value={r.rating} />
                {r.verified && (
                  <span className="flex items-center gap-1 text-xs text-forest-500">
                    <CheckCircle className="h-3 w-3" aria-hidden="true" /> Verified purchase
                  </span>
                )}
              </div>
              <p className="whitespace-pre-line text-forest-800">{r.body}</p>
              {r.imageUrl && (
                <a href={r.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block w-fit">
                  <Image src={r.imageUrl} alt="Photo from the customer's review" width={160} height={160} className="h-40 w-40 rounded-lg object-cover" />
                </a>
              )}
              <p className="mt-3 text-sm text-forest-500">
                <span className="font-medium text-forest-900">{r.name ?? "Anonymous"}</span> ·{" "}
                {new Date(r.createdAt).toLocaleDateString("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" })}
              </p>
            </li>
          ))}
        </ul>
      )}

      <WriteReviewForm productId={productId} productName={productName} />
    </section>
  )
}
