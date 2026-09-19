"use client"

import { Suspense } from "react"
import Link from "next/link"
import { ProductCard } from "@/components/ui/product-card"
import { ProductFilters, FilterSidebar } from "@/components/shop/product-filters"
import { Pagination } from "@/components/shop/pagination"
import type { Product } from "@/types"
import { generateCategoryBreadcrumb, serializeJsonLd } from "@/lib/structured-data"
import { isNonPlantCategorySlug } from "@/lib/product-categories"

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
}

export function ShopCategoryClient({ products, meta, categorySlug, currentPage, totalPages }: ShopCategoryClientProps) {
  const isPlantCategory = !isNonPlantCategorySlug(categorySlug)
  const breadcrumbSchema = generateCategoryBreadcrumb(meta.title, categorySlug, currentPage > 1 ? currentPage : undefined)

  return (
    <ProductFilters products={products}>
      {(filteredProducts, { filters, maxPrice, hasActiveFilters, updateFilter, clearFilters }) => (
        <>
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
                  <div className="mb-4">
                    <p className="font-mono text-sm text-forest-500">
                      Showing {filteredProducts.length} {filteredProducts.length !== 1 ? "items" : "item"}
                    </p>
                  </div>
                  {products.length === 0 ? (
                    // A category with no stock yet is not a filter problem: say so and offer a way forward.
                    <div className="text-center py-20 bg-white rounded-lg border border-forest-200">
                      <p className="text-forest-800 text-lg mb-2">Nothing in {meta.title} just yet.</p>
                      <p className="text-forest-600 mb-4">New plants arrive often. Meanwhile, have a look at everything we have.</p>
                      <Link href="/shop/all" className="text-clay-600 underline font-medium">Browse all plants</Link>
                    </div>
                  ) : filteredProducts.length === 0 ? (
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
      )}
    </ProductFilters>
  )
}
