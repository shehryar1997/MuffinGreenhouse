"use client"

import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { ProductCard } from "@/components/ui/product-card"
import { Pagination } from "@/components/shop/pagination"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { Product } from "@/types"
import type { NavItem } from "@/types"

interface SearchPageClientProps {
  query: string
  products: Product[]
  currentPage: number
  totalPages: number
  totalCount: number
  popularCategories: NavItem[]
}

export function SearchPageClient({
  query,
  products,
  currentPage,
  totalPages,
  totalCount,
  popularCategories
}: SearchPageClientProps) {
  const hasResults = products.length > 0
  
  return (
    <div className="bg-cream-100 min-h-screen pb-8 pt-28 lg:pt-36">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs text-primary">SEARCH</span>
            <Search className="w-4 h-4 text-forest-400" />
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl text-forest-900 leading-tight mb-4">
            Results for &ldquo;{query}&rdquo;
          </h1>
          <p className="text-lg text-forest-600">
            {hasResults ? `Found ${totalCount} plant${totalCount !== 1 ? 's' : ''}` : 'No plants found matching your search'}
          </p>
        </div>

        {!hasResults ? (
          <ZeroResultsState query={query} popularCategories={popularCategories} />
        ) : (
          <>
            {/* Results grid */}
            <div className="mb-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} />
            )}

            {/* Popular categories suggestion */}
            <div className="mt-12 pt-8 border-t border-forest-100">
              <h2 className="font-serif text-2xl text-forest-900 mb-4">Popular categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {popularCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={category.href}
                    className="group block p-4 bg-surface border border-forest-100 rounded-lg hover:border-forest-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-forest-800 group-hover:text-primary transition-colors">
                        {category.label}
                      </span>
                      <ArrowRight className="w-3 h-3 text-forest-400 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ZeroResultsState({ query, popularCategories }: { query: string; popularCategories: NavItem[] }) {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Search className="w-12 h-12 mx-auto text-forest-300 mb-4" />
          <h2 className="font-serif text-2xl text-forest-900 mb-2">
            No plants found matching &ldquo;{query}&rdquo;
          </h2>
          <p className="text-forest-600">
            Try different keywords or browse our collections
          </p>
        </div>

        {/* Popular categories */}
        <div className="mb-8">
          <h3 className="font-serif text-lg text-forest-800 mb-4">Popular categories</h3>
          <div className="grid grid-cols-2 gap-3">
            {popularCategories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className="group block p-3 bg-surface border border-forest-100 rounded-lg hover:border-forest-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm text-forest-800 group-hover:text-primary transition-colors">
                    {category.label}
                  </span>
                  <ArrowRight className="w-3 h-3 text-forest-400 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Plant finder CTA */}
        <div className="border-t border-forest-100 pt-8">
          <h3 className="font-serif text-lg text-forest-800 mb-3">Not sure what you&apos;re looking for?</h3>
          <p className="text-forest-600 mb-4">
            Take our plant finder quiz to discover plants perfect for your space
          </p>
          <Button asChild variant="outline" className="border-forest-200 hover:bg-forest-50">
            <Link href="/plant-finder">
              Find Your Plant <ArrowRight className="w-3 h-3 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}