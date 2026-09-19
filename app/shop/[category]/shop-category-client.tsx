"use client"

import { Suspense } from "react"
import Link from "next/link"
import { ProductCard } from "@/components/ui/product-card"
import { ProductFilters, FilterSidebar, MAX_PRICE } from "@/components/shop/product-filters"
import { Pagination } from "@/components/shop/pagination"
import type { Product } from "@/types"
import { generateCategoryBreadcrumb, serializeJsonLd } from "@/lib/structured-data"
import { isNonPlantCategorySlug } from "@/lib/product-categories"
import type { FilterParams } from "@/lib/data/products"

interface CategoryMeta {
  title: string
  description: string
  tagline: string
}

interface ShopCategoryClientProps {
  products: Product[]
  meta: CategoryMeta
  categorySlug: string
  currentPage: number
  totalPages: number
  totalCount: number
  filters: FilterParams
  priceBounds: { min: number; max: number }
}

export function ShopCategoryClient({ products, meta, categorySlug, currentPage, totalPages, totalCount, filters: initialFilters, priceBounds }: ShopCategoryClientProps) {
  const isPlantCategory = !isNonPlantCategorySlug(categorySlug)
  const breadcrumbSchema = generateCategoryBreadcrumb(meta.title, categorySlug, currentPage > 1 ? currentPage : undefined)

  return (
    <ProductFilters products={products} initialFilters={initialFilters} priceBounds={priceBounds}>
      {(filteredProducts, helpers) => {
        const { filters, maxPrice, hasActiveFilters, updateFilter, clearFilters, activeFilterChips } = helpers
        return (
          <>
            <div className="bg-cream-100 min-h-screen pb-8 pt-28 lg:pt-36">
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
                      maxPrice={maxPrice}
                      hasActiveFilters={hasActiveFilters}
                      updateFilter={updateFilter}
                      clearFilters={clearFilters}
                      showClearButtonText="Clear All"
                    />
                  ) : (
                    <FilterSidebar
                      filters={filters}
                      maxPrice={maxPrice}
                      hasActiveFilters={hasActiveFilters}
                      updateFilter={updateFilter}
                      clearFilters={clearFilters}
                      showClearButtonText="Clear All"
                      hidePlantFilters
                    />
                  )}
                  <div className="flex-1">
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-mono text-sm text-forest-500">
                          Showing {products.length} of {totalCount} {products.length !== 1 ? "items" : "item"}
                        </p>
                        {activeFilterChips.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {activeFilterChips}
                          </div>
                        )}
                      </div>
                      {isPlantCategory && (
                        <div>
                          <select 
                            className="font-mono text-sm text-forest-700 bg-surface border border-forest-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-clay-300"
                            value={filters.sort || 'new'}
                            onChange={(e) => updateFilter('sort', e.target.value)}
                          >
                            <option value="new">Sort by: Newest</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="name">Name: A to Z</option>
                          </select>
                        </div>
                      )}
                    </div>
                    {products.length === 0 && !hasActiveFilters ? (
                      // A category with no stock yet is not a filter problem: say so and offer a way forward.
                      <div className="text-center py-20 bg-surface rounded-lg border border-forest-200">
                        <p className="text-forest-800 text-lg mb-2">Nothing in {meta.title} just yet.</p>
                        <p className="text-forest-600 mb-4">New plants arrive often. Meanwhile, have a look at everything we have.</p>
                        <Link href="/shop/all" className="text-clay-600 underline font-medium">Browse all plants</Link>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-20 bg-surface rounded-lg border border-forest-200">
                        <p className="text-forest-600 text-lg mb-2">No items match your filters.</p>
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
