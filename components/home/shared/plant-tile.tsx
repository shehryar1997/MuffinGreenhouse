import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Droplets, PawPrint, Sun } from "lucide-react"
import { PhotoFallback } from "@/components/home/shared/plant-art"
import { isPlantProduct } from "@/lib/product-categories"
import { formatPrice } from "@/lib/utils"
import type { Product } from "@/types"

const LIGHT: Record<string, string> = { low: "Low light", medium: "Medium light", bright: "Bright light", full_sun: "Full sun" }
const WATER: Record<string, string> = { low: "Water rarely", medium: "Water weekly", high: "Water often" }

/** One product on the homepage: its photo (or an illustration until there is one), name, price and a few care facts. */
export function PlantTile({ product, ratio = "aspect-[4/5]", priority = false }: { product: Product; ratio?: string; priority?: boolean }) {
  const photo = product.images[0]?.url
  const isPlant = isPlantProduct(product)
  const soldOut = product.stockStatus === "out_of_stock"

  return (
    <Link href={`/shop/product/${product.slug}`} className="group block focus-visible:outline-none">
      <div className={`relative overflow-hidden rounded-2xl bg-muted ring-1 ring-border/60 transition-shadow duration-300 group-hover:shadow-xl ${ratio}`}>
        {photo ? (
          <Image
            src={photo}
            alt={product.images[0]?.alt || product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <PhotoFallback slug={product.category.slug} label="Photo coming soon" className="transition-transform duration-700 group-hover:scale-105" />
        )}

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.isNewArrival && <span className="rounded-full bg-secondary px-2.5 py-1 font-mono text-xs lg:text-[10px] uppercase tracking-wider text-secondary-foreground">New</span>}
          {soldOut && <span className="rounded-full bg-ink px-2.5 py-1 font-mono text-xs lg:text-[10px] uppercase tracking-wider text-paper">Sold out</span>}
          {product.stockStatus === "low_stock" && (
            <span className="rounded-full bg-clay-500 px-2.5 py-1 font-mono text-xs lg:text-[10px] uppercase tracking-wider text-white">Only {product.stockCount} left</span>
          )}
        </div>

        <span className="absolute inset-x-3 bottom-3 flex translate-y-3 items-center justify-between rounded-full bg-background/95 px-4 py-2 font-mono text-xs lg:text-[11px] uppercase tracking-widest text-foreground opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          View plant <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4">
        <p className="font-mono text-xs lg:text-[11px] uppercase tracking-widest text-muted-foreground">{product.category.name}</p>
        <h3 className="mt-1 font-serif text-xl leading-tight text-foreground transition-colors group-hover:text-primary">{product.name}</h3>
        <p className="mt-1 font-mono text-sm text-foreground">{formatPrice(product.price)}</p>
        {isPlant && (
          <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5" aria-hidden="true" /> {LIGHT[product.lightRequirement] ?? "Light varies"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5" aria-hidden="true" /> {WATER[product.waterRequirement] ?? "Water varies"}
            </span>
            {product.isPetSafe && (
              <span className="inline-flex items-center gap-1.5 text-sprout-700">
                <PawPrint className="h-3.5 w-3.5" aria-hidden="true" /> Pet safe
              </span>
            )}
          </p>
        )}
      </div>
    </Link>
  )
}
