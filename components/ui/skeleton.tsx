"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#E8E4DC]", className)}
      aria-hidden="true"
    />
  )
}

// Product card skeleton - matches ProductCard layout
export function ProductCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="group relative" style={{ animationDelay: `${index * 50}ms` }}>
      {/* Image block - aspect-[4/5] */}
      <Skeleton className="aspect-[4/5] rounded-xl mb-4" />
      
      {/* Text content */}
      <div className="space-y-2">
        {/* Category line */}
        <Skeleton className="h-3 w-20" />
        {/* Title - 2 lines */}
        <Skeleton className="h-5 w-3/4" />
        {/* Price */}
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

// Product card skeleton grid
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} index={i} />
      ))}
    </div>
  )
}

// Filter sidebar skeleton
export function FilterSidebarSkeleton() {
  return (
    <div className="w-full lg:w-64 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
      
      {/* Filter sections */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Shop page layout skeleton (all/category pages)
export function ShopPageSkeleton() {
  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-8 pt-28 lg:pt-36">
      <div className="container mx-auto px-4">
        {/* Title skeleton */}
        <div className="mb-8">
          <Skeleton className="h-12 lg:h-16 w-2/3 max-w-2xl" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <FilterSidebarSkeleton />

          <div className="flex-1">
            {/* Count text */}
            <div className="mb-4">
              <Skeleton className="h-4 w-32" />
            </div>
            <ProductGridSkeleton count={8} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Checkout/Cart skeleton - matches OrderSummary layout
export function CartSummarySkeleton() {
  return (
    <div className="p-6 bg-white border border-[#D4D0C7] rounded-xl">
      {/* Title */}
      <Skeleton className="h-7 w-40 mb-6" />
      
      {/* Cart items */}
      <div className="space-y-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {/* Image */}
            <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
            {/* Text content */}
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            {/* Price */}
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      
      {/* Totals */}
      <div className="border-t border-[#D4D0C7] pt-6 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="border-t border-[#D4D0C7] pt-4 flex justify-between items-center">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  )
}

// Full checkout page skeleton
export function CheckoutPageSkeleton() {
  return (
    <div className="bg-[#FAF7F2] min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left - Form */}
          <div className="space-y-8">
            {/* Step indicator */}
            <div className="flex items-center gap-4 mb-8">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-1 w-16" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
            
            {/* Form sections */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                </div>
                <Skeleton className="h-12 rounded-lg" />
              </div>
            ))}
          </div>
          
          {/* Right - Order summary */}
          <div className="lg:sticky lg:top-28 h-fit">
            <CartSummarySkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}
