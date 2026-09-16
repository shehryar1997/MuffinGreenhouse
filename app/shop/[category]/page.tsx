"use client"

import { useMemo, useState } from "react"
import { ProductCard } from "@/components/ui/product-card"
import { categoryMeta } from "@/lib/data/products"
import { CategoryFilterSidebar } from "./category-filter-sidebar"
import type { Product } from "@/types"
import { mockProducts } from "@/lib/data/products"

const MAX_PRICE = 250000

interface FilterState {
  searchQuery: string
  priceRange: [number, number]
  lighting: string
  petFriendly: string
  watering: string
}

const defaultFilters: FilterState = {
  searchQuery: "",
  priceRange: [0, MAX_PRICE],
  lighting: "",
  petFriendly: "",
  watering: "",
}

interface ShopCategoryPageProps {
  params: { category: string }
}

export default function ShopCategoryPage({ params }: ShopCategoryPageProps) {
  const categorySlug = params.category

  const meta = categoryMeta[categorySlug] || {
    title: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace(/-/g, " "),
    description: "Browse our collection.",
    tagline: "Quality plants for Karachi."
  }

  // ponytail: Filtering mockProducts client-side during migration
  const categoryProducts = useMemo(() => mockProducts.filter(p => p.category.slug === categorySlug), [categorySlug])
  const isPlantCategory = !["planting-media", "fertilizer", "pots", "other-equipment"].includes(categorySlug)

  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  const filteredProducts = useMemo(() => {
    return categoryProducts.filter((p: Product) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matchesSearch = p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false
      if (isPlantCategory) {
        if (filters.lighting && p.lightRequirement !== filters.lighting) return false
        if (filters.petFriendly) {
          const isPetSafe = filters.petFriendly === "yes"
          if (p.isPetSafe !== isPetSafe) return false
        }
        if (filters.watering && p.waterRequirement !== filters.watering) return false
      }
      return true
    })
  }, [categoryProducts, filters, isPlantCategory])

  const updateFilter = (key: keyof FilterState, value: string | [number, number]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
  }

  const hasActiveFilters = Boolean(
    filters.searchQuery ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < MAX_PRICE ||
    filters.lighting ||
    filters.petFriendly ||
    filters.watering
  )

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-8 pt-28 lg:pt-36">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <p className="font-mono text-xs tracking-widest text-clay-500 uppercase mb-2">{meta.tagline}</p>
          <h1 className="font-serif text-4xl lg:text-5xl text-forest-900 leading-tight">{meta.title}</h1>
          <p className="text-forest-600 mt-2 max-w-2xl">{meta.description}</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <CategoryFilterSidebar
            filters={filters}
            hasActiveFilters={hasActiveFilters}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            isPlantCategory={isPlantCategory}
          />
          <div className="flex-1">
            <div className="mb-4">
              <p className="font-mono text-sm text-forest-500">
                Showing {filteredProducts.length} {filteredProducts.length !== 1 ? "items" : "item"}
              </p>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg border border-forest-200">
                <p className="text-forest-600 text-lg mb-2">No items match your filters.</p>
                <button onClick={clearFilters} className="text-[#E85A3C] underline font-medium">Clear all</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
