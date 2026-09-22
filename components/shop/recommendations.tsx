"use client"

import { useEffect, useState } from "react"
import { SmartImage as Image } from "@/components/ui/smart-image"
import Link from "next/link"
import { ProductCard } from "@/components/ui/product-card"
import { formatPrice } from "@/lib/utils"
import type { Product } from "@/types"

// "You might also like": fetched on the client so each visit shows a fresh pick.
// `compact` is the slim list used inside the cart drawer.
export function Recommendations({ excludeIds, compact = false, onNavigate }: { excludeIds: string[]; compact?: boolean; onNavigate?: () => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const key = excludeIds.join(",")

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/recommendations?exclude=${encodeURIComponent(key)}&limit=${compact ? 3 : 4}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data: { products?: Product[] }) => setProducts(data.products ?? []))
      .catch(() => {
        // Suggestions are a nicety: on any failure just show nothing.
      })
    return () => controller.abort()
  }, [key, compact])

  if (products.length === 0) return null

  if (compact) {
    return (
      <section aria-labelledby="cart-recs" className="border-t border-border pt-5">
        <h3 id="cart-recs" className="mb-3 font-mono text-xs uppercase text-muted-foreground">You might also like</h3>
        <ul className="space-y-3">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/shop/product/${p.slug}`} onClick={onNavigate} className="flex items-center gap-3 rounded-md hover:bg-muted/60">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image src={p.images[0]?.url || "/placeholder-plant.png"} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{p.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{formatPrice(p.price)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <section aria-labelledby="pdp-recs" className="mt-16 border-t border-forest-200 pt-10">
      <h2 id="pdp-recs" className="mb-6 font-serif text-2xl text-forest-900">You might also like</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} sizes="(max-width: 1024px) 50vw, 25vw" />
        ))}
      </div>
    </section>
  )
}
