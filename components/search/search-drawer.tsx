"use client"

import { useRef, useEffect } from "react"
import { Drawer } from "vaul"
import { X, Search, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSearch } from "@/components/providers/search-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/utils"
import { Product } from "@/types"

export function SearchDrawer() {
  const { isOpen, closeSearch, query, setQuery, results } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the input when drawer opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleClose = () => {
    closeSearch()
    setTimeout(() => setQuery(""), 300)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && handleClose()} direction="top">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm z-50" onClick={handleClose} />
        <Drawer.Content className="fixed inset-x-0 top-0 z-50 bg-[#FAF7F2] flex flex-col max-h-[85vh]">
          <div className="flex items-center justify-between p-6 border-b border-forest-200">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#E85A3C]">SEARCH</span>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-forest-100 rounded-full transition-colors" aria-label="Close search">
              <X className="w-5 h-5 text-forest-700" />
            </button>
          </div>

          <div className="p-6 border-b border-forest-200">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" />
              <Input
                ref={inputRef}
                type="search"
                placeholder="Search plants by name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 h-14 text-base border-forest-200 bg-white focus-visible:ring-clay-500"
                aria-label="Search products"
              />
            </form>
          </div>

          <div className="flex-1 overflow-y-auto">
            <SearchResults results={results} query={query} onClose={handleClose} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

interface SearchResultsProps {
  results: Product[]
  query: string
  onClose: () => void
}

function SearchResults({ results, query, onClose }: SearchResultsProps) {
  if (query.trim() === "") {
    return (
      <div className="p-8 text-center">
        <p className="font-serif text-lg text-forest-500">
          Start typing to search for plants
        </p>
        <p className="font-mono text-xs text-forest-400 mt-2">
          Try &quot;Monstera&quot;, &quot;Snake Plant&quot;, or &quot;Pothos&quot;
        </p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="font-serif text-lg text-forest-600 mb-2">
          No plants found matching &ldquo;{query}&rdquo;
        </p>
        <p className="font-mono text-xs text-forest-400">
          Try different search terms or browse all plants
        </p>
        <Button 
          asChild 
          variant="outline" 
          className="mt-6 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
          onClick={onClose}
        >
          <Link href="/shop/all">
            Browse All Plants <ArrowRight className="w-3 h-3 ml-2" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <p className="font-mono text-xs text-forest-500 mb-4">
        {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
      </p>
      <div className="space-y-4">
        {results.map((product) => (
          <Link
            key={product.id}
            href={`/shop/product/${product.slug}`}
            onClick={onClose}
            className="flex gap-4 p-3 -mx-3 hover:bg-forest-100 rounded-lg transition-colors group"
          >
            <div className="relative w-20 h-20 bg-forest-100 shrink-0 rounded-md overflow-hidden">
              <Image
                src={product.images[0]?.url || "/placeholder-plant.png"}
                alt={product.images[0]?.alt || product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="font-serif text-base text-[#1A1A1A] group-hover:text-[#E85A3C] transition-colors line-clamp-1">
                {product.name}
              </h3>
              <p className="font-mono text-xs text-forest-500 mt-1">
                {product.category.name}
              </p>
              <p className="font-mono text-sm text-forest-700 mt-2">
                {formatPrice(product.price)}
              </p>
            </div>
            <div className="flex items-center">
              <ArrowRight className="w-4 h-4 text-forest-400 group-hover:text-[#E85A3C] transition-colors" />
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-forest-200 text-center">
        <Button
          asChild
          variant="outline"
          className="border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
          onClick={onClose}
        >
          <Link href="/shop/all">
            View All Plants <ArrowRight className="w-3 h-3 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  )
}


