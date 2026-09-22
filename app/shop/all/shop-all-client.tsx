"use client"

import { Suspense } from "react"
import Link from "next/link"
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
                          className="font-mono text-sm text-forest-700 bg-surface border border-forest-200 rounded px-3 py-1.5 max-lg:min-h-11 focus:outline-none focus:ring-2 focus:ring-clay-300"
                          value={filters.sort || 'featured'}
                          onChange={(e) => updateFilter('sort', e.target.value === 'featured' ? undefined : e.target.value)}
                          aria-label="Sort products"
                        >
                          <option value="featured">Sort by: Recommended</option>
                          <option value="new">Newest</option>
                          <option value="price-asc">Price: Low to High</option>
                          <option value="price-desc">Price: High to Low</option>
                          <option value="name">Name: A to Z</option>
                        </select>
                      </div>
                    </div>
                    {products.length === 0 && totalCount === 0 && !hasActiveFilters ? (
                      // An empty shop is not a filter problem: say so instead of offering "clear filters".
                      <div className="text-center py-20 bg-surface rounded-lg border border-forest-200">
                        <p className="text-forest-800 text-lg mb-2">New plants are on their way.</p>
                        <p className="text-forest-600 mb-4">We are getting the greenhouse ready. Ask us on WhatsApp what is coming next.</p>
                        <Link href="/contact" className="text-clay-600 underline font-medium">Get in touch</Link>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-20 bg-surface rounded-lg border border-forest-200">
                        <p className="text-forest-600 text-lg mb-2">No plants match your filters.</p>
                        <button onClick={clearFilters} className="text-clay-500 hover:text-clay-600 underline font-medium">
                          Clear all filters
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product, i) => (
                          <ProductCard key={product.id} product={product} index={i} sizes="(max-width: 1200px) 50vw, 33vw" />
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
