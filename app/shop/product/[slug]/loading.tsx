import { Skeleton } from "@/components/ui/skeleton"

// Product detail skeleton - matches ProductDetailClient layout
export default function Loading() {
  return (
    <div className="bg-cream-100 min-h-screen pt-28 pb-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-2" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-2" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left - Images */}
          <div className="space-y-4">
            {/* Main image */}
            <Skeleton className="aspect-square rounded-2xl" />
            {/* Thumbnail row */}
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Right - Product info */}
          <div>
            {/* Category */}
            <Skeleton className="h-4 w-24 mb-2" />
            {/* Title */}
            <Skeleton className="h-10 lg:h-14 w-3/4 mb-4" />
            {/* Description */}
            <div className="space-y-2 mb-6">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-5 w-4/5" />
            </div>

            {/* Price row */}
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>

            {/* Variants */}
            <div className="mb-6">
              <Skeleton className="h-4 w-16 mb-3" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-20 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <Skeleton className="h-4 w-16 mb-3" />
              <div className="inline-flex items-center border border-[#D4D0C7] rounded-lg">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-12" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mb-8">
              <Skeleton className="h-12 flex-1 rounded-lg" />
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>

            {/* Care requirements */}
            <div className="border-t border-[#D4D0C7] pt-6">
              <Skeleton className="h-7 w-40 mb-4" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-cream-100">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
