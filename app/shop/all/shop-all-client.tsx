"use client"

import { Suspense } from "react"
import { ProductCard } from "@/components/ui/product-card"
import { ProductFilters, FilterSidebar } from "@/components/shop/product-filters"
import { Pagination } from "@/components/shop/pagination"
import type { Product } from "@/types"
import { generateShopAllBreadcrumb, serializeJsonLd } from "@/lib/structured-data"

interface ShopAllClientProps {
  products: Product[]
  currentPage: number
  totalPages: number
}

export function ShopAllClient({ products, currentPage, totalPages }: ShopAllClientProps) {
  const breadcrumbSchema = generateShopAllBreadcrumb(currentPage > 1 ? currentPage : undefined)
  
  return (
    <ProductFilters products={products}>
      {(filteredProducts, helpers) => {
        const { filters, maxPrice, hasActiveFilters, updateFilter, clearFilters } = helpers
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
                    <div className="mb-4">
                      <p className="font-mono text-sm text-forest-500">
                        Showing {filteredProducts.length} plant{filteredProducts.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-lg border border-forest-200">
                        <p className="text-forest-600 text-lg mb-2">No plants match your filters.</p>
                        <button onClick={clearFilters} className="text-clay-500 hover:text-clay-600 underline font-medium">
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
