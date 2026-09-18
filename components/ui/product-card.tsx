"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingBag, Heart, Eye } from "lucide-react"
import { Product } from "@/types"
import { formatPrice } from "@/lib/utils"
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/shop/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-forest-50 mb-4">
          <Image
            src={product.images[0]?.url || "/placeholder-plant.png"}
            alt={product.images[0]?.alt || product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Overlay actions */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-forest-900/20" />
            <Button size="icon" variant="secondary" className="relative z-10 rounded-full bg-cream-100 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleAddToCart} disabled={isOutOfStock} aria-label={isOutOfStock ? "Out of stock" : "Add to cart"}>
              <ShoppingBag className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="relative z-10 rounded-full bg-cream-100 hover:bg-white"
              onClick={handleToggleWishlist}
              disabled={isTogglingWishlist}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn("w-4 h-4", wishlisted && "fill-clay-500 text-clay-500")} />
            </Button>
            <Button size="icon" variant="secondary" className="relative z-10 rounded-full bg-cream-100 hover:bg-white">
              <Eye className="w-4 h-4" />
            </Button>
          </motion.div>
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNewArrival && <Badge variant="secondary">New</Badge>}
            {stockBadge}
            {product.isPetSafe && <Badge variant="outline">Pet Safe</Badge>}
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-mono text-xs text-forest-500 uppercase tracking-wider">{product.category.name}</p>
          <h3 className="font-medium text-forest-900 group-hover:text-clay-600 transition-colors">{product.name}</h3>
          <p className="font-mono text-sm text-forest-700">{formatPrice(product.price)}</p>
          {product.variants.length > 1 && (
            <p className="text-xs text-forest-500">{product.variants.length} sizes</p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
