"use client"

import { getAllProducts } from "@/lib/data/products"
import { ProductCard } from "@/components/ui/product-card"
import { ProductFilters, FilterSidebar } from "@/components/shop/product-filters"

export default function ShopAllPage() {
  const allProducts = getAllProducts()
  return (
    <ProductFilters products={allProducts}>
      {(filteredProducts, helpers) => {
        const { filters, hasActiveFilters, updateFilter, clearFilters } = helpers
        return (
          <div className="bg-[#FAF7F2] min-h-screen pb-8 pt-28 lg:pt-36">
            <div className="container mx-auto px-4">
              <div className="mb-8">
                <h1 className="font-serif text-4xl lg:text-5xl text-forest-900 leading-tight">
                  Shop the next addition for your collection.
                </h1>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                <FilterSidebar
                  filters={filters}
                  hasActiveFilters={hasActiveFilters}
                  updateFilter={updateFilter}
                  clearFilters={clearFilters}
                  showClearButtonText="Clear All Filters"
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
      }}
    </ProductFilters>
  )
}

