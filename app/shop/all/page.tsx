"use client"

import { useState, useMemo } from "react"
import { ProductCard } from "@/components/ui/product-card"
import type { Product } from "@/types"
import { mockProducts } from "@/lib/data/products"
import { ShopFilterSidebar } from "./shop-filter-sidebar"

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

export default function ShopAllPage() {
  const allProducts: Product[] = mockProducts
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p: Product) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matchesSearch = p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false
      if (filters.lighting && p.lightRequirement !== filters.lighting) return false
      if (filters.petFriendly) {
        const isPetSafe = filters.petFriendly === "yes"
        if (p.isPetSafe !== isPetSafe) return false
      }
      if (filters.watering && p.waterRequirement !== filters.watering) return false
      return true
    })
  }, [allProducts, filters])

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
          <h1 className="font-serif text-4xl lg:text-5xl text-forest-900 leading-tight">
            Shop the next addition for your collection.
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <ShopFilterSidebar
            filters={filters}
            hasActiveFilters={hasActiveFilters}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
          />

          <div className="flex-1">
            <div className="mb-4">
              <p className="font-mono text-sm text-forest-500">
                Showing {filteredProducts.length} plant{filteredProducts.length !== 1 ? "s" : ""}
              </p>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg border border-forest-200">
                <p className="text-forest-600 text-lg mb-2">No plants match your filters.</p>
                <button onClick={clearFilters} className="text-[#E85A3C] underline font-medium">
                  Clear all filters
                </button>
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

