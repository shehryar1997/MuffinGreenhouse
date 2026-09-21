"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FadeIn, AnimatedHeading } from "@/components/home/shared/animations"
import { SectionLabel } from "@/components/home/shared/section-label"
import { PlantTile } from "@/components/home/shared/plant-tile"
import type { Product } from "@/types"

/** In-stock first, then new arrivals, then newest. */
export function pickFeatured(products: Product[], limit = 4): Product[] {
  return [...products]
    .sort((a, b) => Number(b.stockStatus !== "out_of_stock") - Number(a.stockStatus !== "out_of_stock") || Number(b.isNewArrival) - Number(a.isNewArrival) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

/** The most recently added products (plants and tools alike), newest first. */
export function latestProducts(products: Product[], limit = 10): Product[] {
  return [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit)
}

// Shown only when the shop has something to show.
export function FeaturedPlants({ products, n }: { products: Product[]; n: string }) {
  const featured = pickFeatured(products)
  if (featured.length === 0) return null

  return (
    <section className="bg-background py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <FadeIn>
          <SectionLabel n={n} label="Fresh in the greenhouse" />
        </FadeIn>
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-serif text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.95] tracking-tight text-foreground">
            <AnimatedHeading lines={["Just in,", "ready to go home."]} />
          </h2>
          <FadeIn delay={0.2}>
            <Link
              href="/shop/all"
              className="group inline-flex items-center gap-3 border-b border-forest-300 pb-2 font-mono text-xs uppercase tracking-widest text-forest-800 transition-colors hover:border-clay-500 hover:text-clay-600"
            >
              See all plants
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </FadeIn>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          {featured.map((product, i) => (
            <FadeIn key={product.id} delay={i * 0.08}>
              <PlantTile product={product} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
