"use client"

import { ProductCard } from "@/components/ui/product-card"
import { ProductFilters, FilterSidebar } from "@/components/shop/product-filters"
import { getAllProducts, categoryMeta } from "@/lib/data/products"
import { useParams } from "next/navigation"

export default function ShopCategoryPage() {
  const params = useParams()
  const categorySlug = params.category as string

  const meta = categoryMeta[categorySlug] || {
    title: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace(/-/g, " "),
    description: "Browse our collection.",
    tagline: "Quality plants for Karachi."
  }

  const categoryProducts = getAllProducts().filter((p) => p.category.slug === categorySlug)
  const isPlantCategory = !["planting-media", "fertilizer", "pots", "other-equipment"].includes(categorySlug)

  return (
    <ProductFilters products={categoryProducts}>
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
                <aside className="w-full lg:w-64 lg:flex-shrink-0">
                  <div className="sticky top-4 space-y-6">
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="w-full py-2 text-sm font-mono text-forest-600 border border-forest-300 rounded hover:bg-forest-100 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </aside>
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
