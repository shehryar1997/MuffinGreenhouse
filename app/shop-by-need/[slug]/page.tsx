"use client"

import { useMemo } from "react"
import { notFound } from "next/navigation"
import { motion } from "framer-motion"
import { mockProducts, useCases } from "@/data/mock-products"
import { ProductCard } from "@/components/ui/product-card"

export default function ShopByNeedPage({ params }: { params: { slug: string } }) {
  const useCase = useCases[params.slug]
  const products = useMemo(() => mockProducts.filter(p => p.useCaseTags.includes(params.slug)), [params.slug])

  if (!useCase) return notFound()

  return (
    <div className="bg-cream-100 min-h-screen pt-28 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="text-4xl mb-4 block">{useCase.icon}</span>
          <h1 className="font-serif text-heading-1 text-forest-900 mb-2">{useCase.title}</h1>
          <p className="text-forest-600">{useCase.desc}</p>
          <p className="text-forest-500 text-sm mt-2">{products.length} plants match</p>
        </motion.div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-forest-500 text-lg">No plants in this category right now.</p>
            <p className="text-forest-400">Check back or browse all plants.</p>
          </div>
        )}
      </div>
    </div>
  )
}
