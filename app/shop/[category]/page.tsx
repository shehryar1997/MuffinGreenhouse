"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { mockProducts, categoryMeta } from "@/data/mock-products"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Search } from "lucide-react"
import type { Product } from "@/types"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

interface Filters {
  searchQuery: string
  priceRange: [number, number]
  lighting: string
  petFriendly: string
  watering: string
}

const MAX_PRICE = 250000

function ProductCard({ product, index }: { product: Product; index: number }) {
  const isOutOfStock = product.stockStatus === "out_of_stock"
  const isLowStock = product.stockStatus === "low_stock"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group"
    >
      <Link href={`/shop/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-forest-100 mb-3">
          <Image
            src={product.images[0]?.url || "/placeholder.png"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-forest-900/60 flex items-center justify-center">
              <span className="text-cream-100 font-mono text-sm px-3 py-1 border border-cream-100/50">SOLD OUT</span>
            </div>
          )}
          {isLowStock && (
            <div className="absolute top-2 left-2">
              <span className="bg-clay-500 text-white text-xs px-2 py-1 rounded-full">Low Stock</span>
            </div>
          )}
          {product.isNewArrival && (
            <div className="absolute top-2 left-2">
              <span className="bg-forest-500 text-white text-xs px-2 py-1 rounded-full">New</span>
            </div>
          )}
        </div>
      </Link>
      <div className="space-y-1">
        <h3 className="font-serif text-forest-900 group-hover:text-clay-500 transition-colors">
          <Link href={`/shop/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="text-sm text-forest-600">{product.category.name}</p>
        <p className="font-mono text-clay-500">PKR {product.price.toLocaleString()}</p>
        {isOutOfStock ? (
          <p className="text-xs text-forest-400 italic">Out of stock</p>
        ) : (
          <p className={`text-xs ${isLowStock ? "text-clay-500" : "text-forest-400"}`}>{isLowStock ? "Only a few left" : "In stock"}</p>
        )}
      </div>
    </motion.div>
  )
}

export default function ShopCategoryPage() {
  const params = useParams()
  const categorySlug = params.category as string
  
  const meta = categoryMeta[categorySlug] || {
    title: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace(/-/g, " "),
    description: "Browse our collection.",
    tagline: "Quality plants for Karachi."
  }

  const [filters, setFilters] = useState<Filters>({
    searchQuery: "",
    priceRange: [0, MAX_PRICE],
    lighting: "",
    petFriendly: "",
    watering: ""
  })

  const filteredProducts = useMemo(() => {
    let categoryProducts = mockProducts.filter((p: Product) => p.category.slug === categorySlug)
    return categoryProducts.filter((p: Product) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matchesSearch = p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false
      if (filters.lighting && p.lightRequirement !== filters.lighting) return false
      if (filters.petFriendly) {
        const isPetSafe = filters.petFriendly === "yes"
        if (p.isPetSafe !== isPetSafe) return false
      }
      if (filters.watering && p.waterRequirement !== filters.watering) return false
      return true
    })
  }, [filters, categorySlug])

  const updateFilter = (key: keyof Filters, value: string) => setFilters((prev) => ({ ...prev, [key]: value }))
  const clearFilters = () => setFilters({ searchQuery: "", priceRange: [0, MAX_PRICE], lighting: "", petFriendly: "", watering: "" })
  const hasActiveFilters = filters.searchQuery || filters.priceRange[0] > 0 || filters.priceRange[1] < MAX_PRICE || filters.lighting || filters.petFriendly || filters.watering
  const isPlantCategory = !["planting-media", "fertilizer", "pots", "other-equipment"].includes(categorySlug)

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-8 pt-28 lg:pt-36">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <p className="font-mono text-xs tracking-widest text-clay-500 uppercase mb-2">{meta.tagline}</p>
          <h1 className="font-serif text-4xl lg:text-5xl text-forest-900 leading-tight">{meta.title}</h1>
          <p className="text-forest-600 mt-2 max-w-2xl">{meta.description}</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 lg:flex-shrink-0">
            <div className="sticky top-4 space-y-6">
              <div>
                <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Search</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400" />
                  <Input placeholder={`Search ${meta.title.toLowerCase()}...`} value={filters.searchQuery} onChange={(e) => updateFilter("searchQuery", e.target.value)} className="pl-10 bg-white border-forest-200" />
                </div>
              </div>
              <div>
                <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Price Range (PKR)</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-mono text-forest-600">
                    <span>PKR {filters.priceRange[0].toLocaleString()}</span>
                    <span>PKR {filters.priceRange[1].toLocaleString()}</span>
                  </div>
                  <Slider min={0} max={MAX_PRICE} step={500} value={filters.priceRange} onValueChange={(v) => setFilters((f) => ({ ...f, priceRange: [v[0] ?? 0, v[1] ?? MAX_PRICE] }))} />
                </div>
              </div>
              {isPlantCategory && (
                <>
                  <div>
                    <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Lighting</h3>
                    <div className="space-y-2">
                      {["low", "medium", "bright", "full_sun"].map((val) => (
                        <label key={val} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="lighting" value={val} checked={filters.lighting === val} onChange={(e) => updateFilter("lighting", e.target.value)} className="accent-[#E85A3C]" />
                          <span className="text-sm text-forest-700">{val === "low" ? "Low Light" : val === "medium" ? "Medium Light" : val === "bright" ? "Bright Indirect" : "Full Sun"}</span>
                        </label>
                      ))}
                      {filters.lighting && <button onClick={() => updateFilter("lighting", "")} className="text-xs text-forest-500 underline mt-1">Clear</button>}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Pet-Friendly</h3>
                    <div className="space-y-2">
                      {["yes", "no"].map((val) => (
                        <label key={val} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="petFriendly" value={val} checked={filters.petFriendly === val} onChange={(e) => updateFilter("petFriendly", e.target.value)} className="accent-[#E85A3C]" />
                          <span className="text-sm text-forest-700">{val === "yes" ? "Yes" : "No"}</span>
                        </label>
                      ))}
                      {filters.petFriendly && <button onClick={() => updateFilter("petFriendly", "")} className="text-xs text-forest-500 underline mt-1">Clear</button>}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Watering</h3>
                    <div className="space-y-2">
                      {["low", "medium", "high"].map((val) => (
                        <label key={val} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="watering" value={val} checked={filters.watering === val} onChange={(e) => updateFilter("watering", e.target.value)} className="accent-[#E85A3C]" />
                          <span className="text-sm text-forest-700">{val === "low" ? "Low" : val === "medium" ? "Medium" : "High"}</span>
                        </label>
                      ))}
                      {filters.watering && <button onClick={() => updateFilter("watering", "")} className="text-xs text-forest-500 underline mt-1">Clear</button>}
                    </div>
                  </div>
                </>
              )}
              {hasActiveFilters && <button onClick={clearFilters} className="w-full py-2 text-sm font-mono text-forest-600 border border-forest-300 rounded hover:bg-forest-100 transition-colors">Clear All</button>}
            </div>
          </aside>
          <div className="flex-1">
            <div className="mb-4">
              <p className="font-mono text-sm text-forest-500">Showing {filteredProducts.length} {filteredProducts.length !== 1 ? "items" : "item"}</p>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg border border-forest-200">
                <p className="text-forest-600 text-lg mb-2">No items match your filters.</p>
                <button onClick={clearFilters} className="text-[#E85A3C] underline font-medium">Clear all</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
