"use client"

import { Suspense } from "react"
import { ProductCard } from "@/components/ui/product-card"
import { ProductFilters, FilterSidebar, MAX_PRICE } from "@/components/shop/product-filters"
import { Pagination } from "@/components/shop/pagination"
import type { Product } from "@/types"
import { generateShopAllBreadcrumb, serializeJsonLd } from "@/lib/structured-data"
import type { FilterParams } from "@/lib/data/products"

interface ShopAllClientProps {
  products: Product[]
  currentPage: number
  totalPages: number
  totalCount: number
  filters: FilterParams
  priceBounds: { min: number; max: number }
}

export function ShopAllClient({ products, currentPage, totalPages, totalCount, filters: initialFilters, priceBounds }: ShopAllClientProps) {
  const breadcrumbSchema = generateShopAllBreadcrumb(currentPage > 1 ? currentPage : undefined)
  
  return (
    <ProductFilters products={products} initialFilters={initialFilters} priceBounds={priceBounds}>
      {(filteredProducts, helpers) => {
        const { filters, maxPrice, hasActiveFilters, updateFilter, clearFilters, activeFilterChips } = helpers
        return (
          <>
            <div className="bg-cream-100 min-h-screen pb-8 pt-28 lg:pt-36">
              <div className="container mx-auto px-4">
                <div className="mb-8">
                  <h1 className="font-serif text-4xl lg:text-5xl text-forest-900 leading-tight">All plants</h1>
                  <p className="mt-2 text-lg text-forest-600">Shop the next addition for your collection.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                  <FilterSidebar
                    filters={filters}
                    maxPrice={maxPrice}
                    hasActiveFilters={hasActiveFilters}
                    updateFilter={updateFilter}
                    clearFilters={clearFilters}
                    showClearButtonText="Clear All Filters"
                  />

                  <div className="flex-1">
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-mono text-sm text-forest-500">
                          Showing {products.length} of {totalCount} plant{totalCount !== 1 ? "s" : ""}
                        </p>
                        {activeFilterChips.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {activeFilterChips}
                          </div>
                        )}
                      </div>
                      <div>
                        <select 
                          className="font-mono text-sm text-forest-700 bg-white border border-forest-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-clay-300"
                          value={filters.sort || 'new'}
                          onChange={(e) => updateFilter('sort', e.target.value)}
                        >
                          <option value="new">Sort by: Newest</option>
                          <option value="price-asc">Price: Low to High</option>
                          <option value="price-desc">Price: High to Low</option>
                          <option value="name">Name: A to Z</option>
                        </select>
                      </div>
                    </div>
                    {products.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-lg border border-forest-200">
                        <p className="text-forest-600 text-lg mb-2">No plants match your filters.</p>
                        <button onClick={clearFilters} className="text-clay-500 hover:text-clay-600 underline font-medium">
                          Clear all filters
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product, i) => (
                          <ProductCard key={product.id} product={product} index={i} />
                        ))}
                      </div>
                    )}
                    <Suspense fallback={null}>
                      <Pagination currentPage={currentPage} totalPages={totalPages} />
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
            />
          </>
        )
      }}
    </ProductFilters>
  )
}
