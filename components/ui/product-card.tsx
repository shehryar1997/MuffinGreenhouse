"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingBag, Heart, Eye } from "lucide-react"
import { Product } from "@/types"
import { formatPrice } from "@/lib/utils"
import { isPlantProduct } from "@/lib/product-categories"
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
}

export function ProductCard({ product, index = 0, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)
  const { addItem, toggleCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const router = useRouter()
  const wishlisted = isWishlisted(product.id)

  const isOutOfStock = product.stockStatus === "out_of_stock"

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    addItem(product, undefined, 1)
    toast(`${product.name} added to cart`, { action: { label: "View Cart", onClick: () => toggleCart(true) } })
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

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        href={`/shop/product/${product.slug}`} 
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-muted mb-4 transition-shadow duration-300 group-hover:shadow-lg">
          <Image
            src={product.images[0]?.url || "/placeholder-plant.png"}
            alt={product.images[0]?.alt || product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Overlay actions */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center gap-2 sm:gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-background/60 dark:bg-foreground/20 backdrop-blur-[2px] transition-opacity" />
            <Button 
              size="icon" 
              variant="secondary" 
              className="relative z-10 h-10 w-10 rounded-full bg-background/95 hover:bg-background shadow-sm touch-target-sm"
              onClick={handleAddToCart} 
              disabled={isOutOfStock} 
              aria-label={isOutOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
            >
              <ShoppingBag className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="relative z-10 h-10 w-10 rounded-full bg-background/95 hover:bg-background shadow-sm touch-target-sm"
              onClick={handleToggleWishlist}
              disabled={isTogglingWishlist}
              aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            >
              <Heart className={cn("w-4 h-4", wishlisted && "fill-primary text-primary")} />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className="relative z-10 h-10 w-10 rounded-full bg-background/95 hover:bg-background shadow-sm touch-target-sm"
              aria-label={`Quick view ${product.name}`}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </motion.div>
          
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
          <p className="font-mono text-sm text-foreground">{formatPrice(product.price)}</p>
          {product.variants.length > 1 && (
            <p className="text-xs text-muted-foreground">{product.variants.length} sizes available</p>
          )}
        </div>
      </Link>
    </motion.article>
  )
}
