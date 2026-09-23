"use client"

import { useState } from "react"
import { SmartImage as Image } from "@/components/ui/smart-image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingBag, Heart, Eye } from "lucide-react"
import { Product } from "@/types"
import { formatPrice } from "@/lib/utils"
import { isPlantProduct } from "@/lib/product-categories"
import { LIGHT_LABEL, WATER_LABEL } from "@/lib/care-labels"
import { displayPrice, startingFromPrice } from "@/lib/product-photos"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"
import { Button } from "./button"
import { useCart } from "@/components/providers/cart-provider"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ProductCardProps {
  product: Product
  index?: number
  className?: string
  /** Image size hint. The default suits a 1-column phone layout; 2-column grids pass a smaller one. */
  sizes?: string
}

export function ProductCard({ product, index = 0, className, sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" }: ProductCardProps) {
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)
  const { addItem } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const router = useRouter()
  const wishlisted = isWishlisted(product.id)

  const isOutOfStock = product.stockStatus === "out_of_stock"
  // Several variants at different prices show "Starting from" the lowest; a single price is shown plain.
  const fromPrice = startingFromPrice(product)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    // Several sizes: a quick add can't know which one, so send the customer to pick (it used to add
    // the base product with no size, i.e. the wrong price/SKU). One size: add that size, as the product page does.
    if (product.variants.length > 1) {
      router.push(`/shop/product/${product.slug}`)
      return
    }
    // Adding opens the cart drawer, which is the confirmation (a toast on top of it said the same thing twice).
    addItem(product, product.variants[0], 1)
  }

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isTogglingWishlist) return
    setIsTogglingWishlist(true)
    const result = await toggleWishlist(product.id)
    setIsTogglingWishlist(false)

    if (!result.signedIn) {
      toast("Sign in to save plants to your wishlist", {
        action: { label: "Sign in", onClick: () => router.push("/account/login") },
      })
      return
    }
    if (!result.ok) {
      toast.error("Couldn't update your wishlist. Try again")
      return
    }
    toast(wishlisted ? `Removed ${product.name} from wishlist` : `${product.name} added to wishlist`)
  }

  const stockBadge = product.stockStatus === "out_of_stock" ? (
    <Badge variant="outOfStock">Out of Stock</Badge>
  ) : product.stockStatus === "low_stock" ? (
    <Badge variant="lowStock">Only {product.stockCount} left</Badge>
  ) : null

  // One size: a struck-through "was" price when it has one.
  const onlySize = product.variants.length === 1 ? product.variants[0] : null
  const wasPrice = onlySize?.compareAtPrice
  const careLine = isPlantProduct(product)
    ? [LIGHT_LABEL[product.lightRequirement], WATER_LABEL[product.waterRequirement]].filter(Boolean).join(" · ")
    : ""

  // The card link and its buttons are siblings, not nested: a button inside a link is invalid markup that screen
  // readers announce as one confusing control.
  return (
    <motion.article
      // Starts half-visible, not invisible, so the grid is readable before scripts load.
      initial={{ opacity: 0.5, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      // Capped: an uncapped index * 0.1 made the 24th card on a page appear after ~2.4 s.
      transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group relative", className)}
    >
      <Link
        href={`/shop/product/${product.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
      >
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-muted mb-4 transition-shadow duration-300 group-hover:shadow-lg">
          <Image
            src={product.images[0]?.url || "/placeholder-plant.png"}
            alt={product.images[0]?.alt || product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes={sizes}
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNewArrival && <Badge variant="secondary">New</Badge>}
            {stockBadge}
            {isPlantProduct(product) && product.isPetSafe && (
              <Badge variant="outline" className="bg-background/80">Pet Safe</Badge>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{product.category.name}</p>
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
          <p className="font-mono text-sm text-foreground">
            {fromPrice !== null ? `Starting from ${formatPrice(fromPrice)}` : formatPrice(displayPrice(product))}
            {fromPrice === null && wasPrice && wasPrice > displayPrice(product) && (
              <span className="ml-2 text-muted-foreground line-through"><span className="sr-only">Was </span>{formatPrice(wasPrice)}</span>
            )}
          </p>
          {careLine && <p className="text-xs text-muted-foreground line-clamp-1">{careLine}</p>}
          {product.variants.length > 1 && (
            <p className="text-xs text-muted-foreground">{product.variants.length} sizes available</p>
          )}
        </div>
      </Link>

      {/* Actions over the photo. The layer ignores clicks (they reach the card link underneath); only the buttons take them. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/5] rounded-xl">
        {/* Desktop: shown on hover, and on keyboard focus. */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 max-lg:hidden sm:gap-3">
          <div className="absolute inset-0 rounded-xl bg-background/60 dark:bg-foreground/20 backdrop-blur-[2px]" />
          <Button
            size="icon"
            variant="secondary"
            className="pointer-events-auto relative z-10 h-10 w-10 rounded-full bg-background/95 hover:bg-background shadow-sm touch-target-sm"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={isOutOfStock ? `${product.name} is out of stock` : product.variants.length > 1 ? `Choose a size of ${product.name}` : `Add ${product.name} to cart`}
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="pointer-events-auto relative z-10 h-10 w-10 rounded-full bg-background/95 hover:bg-background shadow-sm touch-target-sm"
            onClick={handleToggleWishlist}
            disabled={isTogglingWishlist}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          >
            <Heart className={cn("w-4 h-4", wishlisted && "fill-primary text-primary")} aria-hidden="true" />
          </Button>
          <Link
            href={`/shop/product/${product.slug}`}
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-auto relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/95 shadow-sm hover:bg-background"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>

        {/* Touch screens have no hover, so the two actions that matter stay in view. */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={isTogglingWishlist}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="pointer-events-auto absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-background/90 shadow-sm transition active:scale-95 lg:hidden"
        >
          <Heart className={cn("h-5 w-5", wishlisted && "fill-primary text-primary")} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          aria-label={isOutOfStock ? `${product.name} is out of stock` : product.variants.length > 1 ? `Choose a size of ${product.name}` : `Add ${product.name} to cart`}
          className="pointer-events-auto absolute bottom-2 right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-background/90 shadow-sm transition active:scale-95 disabled:opacity-40 lg:hidden"
        >
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  )
}
