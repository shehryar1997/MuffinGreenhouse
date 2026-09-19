"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { Product } from "@/types"
import { ProductCard } from "@/components/ui/product-card"

interface WishlistClientProps {
  initialProducts: Product[]
}

export function WishlistClient({ initialProducts }: WishlistClientProps) {
  const [products] = useState<Product[]>(initialProducts)

  if (products.length === 0) {
    return (
      <div className="text-center py-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-forest-100 mb-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-forest-400"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </motion.div>
        <h2 className="font-serif text-2xl text-forest-900 mb-3">No plants saved yet</h2>
        <p className="text-forest-600 mb-8 max-w-sm mx-auto">
          Start exploring and save plants you love to your wishlist.
        </p>
        <Link
          href="/shop/all"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 touch-target"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          Browse plants
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      <AnimatePresence mode="popLayout">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              duration: 0.3,
              delay: Math.min(index, 6) * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <ProductCard product={product} index={index} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
