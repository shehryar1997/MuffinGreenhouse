"use client"

import { ProductCard } from "@/components/ui/product-card"
import { ProductFilters, FilterSidebar } from "@/components/shop/product-filters"
import type { Product } from "@/types"

interface CategoryMeta {
  title: string
  description: string
  tagline: string
}

interface ShopCategoryClientProps {
  products: Product[]
  meta: CategoryMeta
  categorySlug: string
}

export function ShopCategoryClient({ products, meta, categorySlug }: ShopCategoryClientProps) {
  const isPlantCategory = !["planting-media", "fertilizer", "pots", "other-equipment"].includes(categorySlug)

  return (
    <ProductFilters products={products}>
      {(filteredProducts, { filters, hasActiveFilters, updateFilter, clearFilters }) => (
        <div className="bg-[#FAF7F2] min-h-screen pb-8 pt-28 lg:pt-36">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <p className="font-mono text-xs tracking-widest text-clay-500 uppercase mb-2">{meta.tagline}</p>
              <h1 className="font-serif text-4xl lg:text-5xl text-forest-900 leading-tight">{meta.title}</h1>
              <p className="text-forest-600 mt-2 max-w-2xl">{meta.description}</p>
            </div>
            <div className="flex flex-col lg:flex-row gap-8">
              {isPlantCategory ? (
                <FilterSidebar
                  filters={filters}
                  hasActiveFilters={hasActiveFilters}
                  updateFilter={updateFilter}
                  clearFilters={clearFilters}
                  showClearButtonText="Clear All"
                />
              ) : (
                <FilterSidebar
                  filters={filters}
                  hasActiveFilters={hasActiveFilters}
                  updateFilter={updateFilter}
                  clearFilters={clearFilters}
                  showClearButtonText="Clear All"
                  hidePlantFilters
                />
              )}
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
      )}
    </ProductFilters>
  )
}
