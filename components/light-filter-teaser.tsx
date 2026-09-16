"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { LightLevel, lightLevelLabels, getLightPreviewProducts } from "@/lib/plant-utils"
import { formatPrice } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { Product } from "@/types"

interface LightFilterTeaserProps {
  products: Product[]
}

export function LightFilterTeaser({ products }: LightFilterTeaserProps) {
  const [selectedLight, setSelectedLight] = useState<LightLevel>("medium")
  const prefersReducedMotion = useReducedMotion()
  
  const lightOptions: LightLevel[] = ["low", "medium", "bright"]
  const previewProducts = useMemo(() => 
    getLightPreviewProducts(products, selectedLight, 3), 
    [products, selectedLight]
  )

  return (
    <div className="mt-20 pt-16 border-t border-forest-200/50">
      {/* Section Header */}
      <div className="text-center mb-10">
        <p className="text-forest-600 text-lg mb-2">Wondering what works in your space?</p>
        <p className="font-mono text-xs text-forest-400 tracking-widest uppercase">Quick preview by light level</p>
      </div>

      {/* Light Level Selector */}
      <div className="flex justify-center gap-3 mb-12">
        {lightOptions.map((light) => {
          const isSelected = selectedLight === light
          return (
            <button
              key={light}
              onClick={() => setSelectedLight(light)}
              className={`
                relative px-6 py-3 rounded-full text-xs font-medium tracking-wide
                transition-all duration-300 ease-out
                ${isSelected 
                  ? "bg-clay-500 text-white shadow-lg shadow-clay-500/25 scale-105" 
                  : "bg-white text-forest-600 border border-forest-200 hover:border-clay-400 hover:text-clay-600"
                }
              `}
              aria-pressed={isSelected}
            >
              <span className="flex items-center gap-2">
                {/* Light indicator dot */}
                <span 
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    light === "low" ? "bg-amber-400" : 
                    light === "medium" ? "bg-amber-500" : "bg-amber-600"
                  } ${isSelected ? "bg-white/90" : ""}`}
                  aria-hidden="true"
                />
                {lightLevelLabels[light]}
              </span>
              
              {/* Subtle glow for selected state */}
              {isSelected && !prefersReducedMotion && (
                <span className="absolute inset-0 rounded-full bg-clay-500/20 animate-pulse -z-10" />
              )}
            </button>
          )
        })}
      </div>

      {/* Product Thumbnails Grid */}
      <div className="max-w-3xl mx-auto">
        {previewProducts.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {previewProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: prefersReducedMotion ? 0 : index * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                <Link 
                  href={`/shop/product/${product.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-square overflow-hidden bg-cream-200 rounded-lg">
                    {product.images[0]?.url ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 33vw, 20vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-forest-100">
                        <span className="text-forest-300 text-2xl">🌿</span>
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-forest-900/0 group-hover:bg-forest-900/20 transition-colors duration-300" />
                    
                    {/* Stock badge */}
                    {product.stockStatus === "out_of_stock" && (
                      <span className="absolute top-2 left-2 font-mono text-[10px] tracking-wider uppercase bg-forest-900/80 text-white px-2 py-1 rounded-sm">
                        Sold Out
                      </span>
                    )}
                    {product.stockStatus === "low_stock" && (
                      <span className="absolute top-2 left-2 font-mono text-[10px] tracking-wider uppercase bg-clay-500 text-white px-2 py-1 rounded-sm">
                        {product.stockCount} left
                      </span>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="mt-3 text-center">
                    <h4 className="font-serif text-sm text-[#1A1A1A] group-hover:text-clay-600 transition-colors line-clamp-1">
                      {product.name}
                    </h4>
                    <p className="font-mono text-xs text-forest-500 mt-1">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-forest-500 text-sm">No plants match this light level right now.</p>
            <p className="font-mono text-xs text-forest-400 mt-2">Check back soon or try another option.</p>
          </div>
        )}

        {/* View All Link */}
        {previewProducts.length > 0 && (
          <div className="text-center mt-10">
            <Link 
              href="/shop"
              className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-forest-600 hover:text-clay-500 transition-colors group"
            >
              View All {lightLevelLabels[selectedLight]} Plants
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
