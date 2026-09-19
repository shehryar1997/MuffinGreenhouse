"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Product } from "@/types"
import { Mood, MoodTheme, filterProductsByMood } from "@/lib/mood-utils"
import { formatPrice } from "@/lib/utils"

interface MoodPlantsGridProps {
  products: Product[]
  mood: Mood
  theme: MoodTheme
}

export function MoodPlantsGrid({ products, mood, theme }: MoodPlantsGridProps) {
  const moodProducts = useMemo(() => filterProductsByMood(products, mood), [products, mood])
  const displayProducts = moodProducts.slice(0, 4)

  if (displayProducts.length === 0) {
    return (
      <div className={`py-16 text-center font-mono text-xs tracking-widest uppercase ${theme.textMuted}`}>
        No plants matching this mood yet. Check back soon.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {displayProducts.map((product, i) => (
        <Link key={product.id} href={`/shop/product/${product.slug}`} className="group cursor-pointer block">
          <div className={`relative aspect-[3/4] overflow-hidden ${theme.bgSecondary}`}>
            {product.images[0]?.url ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt || product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            ) : null}
            <span className={`absolute top-3 left-3 font-mono text-xs ${theme.textPrimary}`}>{String(i + 1).padStart(2, '0')}</span>
            {product.stockStatus === "out_of_stock" && (
              <span className={`absolute top-3 right-3 font-mono text-xs tracking-wider uppercase px-2 py-1 rounded-sm ${theme.bg === "bg-forest-950" ? "bg-cream-100 text-forest-900" : "bg-forest-900 text-white"}`}>
                Sold Out
              </span>
            )}
            {product.stockStatus === "low_stock" && (
              <span className="absolute top-3 right-3 font-mono text-xs tracking-wider uppercase bg-clay-500 text-white px-2 py-1 rounded-sm">
                Only {product.stockCount} left
              </span>
            )}
          </div>
          <div className="mt-4 flex items-start justify-between">
            <div>
              <div className={`flex items-center gap-2 text-xs mb-1 ${theme.textMuted}`}>
                {product.stockStatus === "out_of_stock" ? (
                  <span className={theme.textSecondary}>SOLD OUT</span>
                ) : (
                  product.isNewArrival && <span className={theme.accentText}>NEW</span>
                )}
              </div>
              <h3 className={`font-serif text-lg transition-colors ${theme.textPrimary} group-hover:opacity-80`}>
                {product.name}
              </h3>
              <p className={`font-mono text-sm mt-1 ${theme.textSecondary}`}>
                {formatPrice(product.price)}
              </p>
            </div>
            <button
              // ponytail: theme-based hover classes removed - Tailwind cannot parse hover:${theme.bg}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors hover:opacity-80 ${theme.border} ${theme.textSecondary}`}
              onClick={(e) => e.preventDefault()}
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </Link>
      ))}
    </div>
  )
}
