"use client"

import { useState, useMemo } from "react"
import { mockProducts } from "@/data/mock-products"
import { ProductCard } from "@/components/ui/product-card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Search } from "lucide-react"
import type { Product } from "@/types"

interface Filters {
  searchQuery: string
  priceRange: [number, number]
  lighting: string
  petFriendly: string
  watering: string
}

const MAX_PRICE = 250000

export default function ShopAllPage() {
  const [filters, setFilters] = useState<Filters>({
    searchQuery: "",
    priceRange: [0, MAX_PRICE],
    lighting: "",
    petFriendly: "",
    watering: "",
  })

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((p: Product) => {
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
  }, [filters])

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ searchQuery: "", priceRange: [0, MAX_PRICE], lighting: "", petFriendly: "", watering: "" })
  }

  const hasActiveFilters =
    filters.searchQuery ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < MAX_PRICE ||
    filters.lighting ||
    filters.petFriendly ||
    filters.watering

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-8 pt-28 lg:pt-36">
      <div className="container mx-auto px-4">
        <div className="mb-8">

          <h1 className="font-serif text-4xl lg:text-5xl text-forest-900 leading-tight">
            Shop the next addition for your collection.
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 lg:flex-shrink-0">
            <div className="sticky top-4 space-y-6">
              <div>
                <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Search</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400" />
                  <Input placeholder="Search plants..." value={filters.searchQuery} onChange={(e) => updateFilter("searchQuery", e.target.value)} className="pl-10 bg-white border-forest-200" />
                </div>
              </div>
              <div>
                <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Price Range (PKR)</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-mono text-forest-600">
                    <span>PKR {filters.priceRange[0].toLocaleString()}</span>
                    <span>PKR {filters.priceRange[1].toLocaleString()}</span>
                  </div>
                  <div className="px-1">
                    <Slider
                      min={0}
                      max={MAX_PRICE}
                      step={1000}
                      value={filters.priceRange}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, priceRange: value as [number, number] }))}
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Lighting</h3>
                <div className="space-y-2">
                  {["low", "medium", "bright", "full_sun"].map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="lighting" value={val} checked={filters.lighting === val} onChange={(e) => updateFilter("lighting", e.target.value)} className="accent-[#E85A3C]" />
                      <span className="text-sm text-forest-700">{val === "low" ? "Low Light" : val === "medium" ? "Medium Light" : val === "bright" ? "Bright Indirect" : "Full Sun"}</span>
                    </label>
                  ))}
                  {filters.lighting && <button onClick={() => updateFilter("lighting", "")} className="text-xs text-forest-500 underline mt-1">Clear selection</button>}
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
                  {filters.petFriendly && <button onClick={() => updateFilter("petFriendly", "")} className="text-xs text-forest-500 underline mt-1">Clear selection</button>}
                </div>
              </div>
              <div>
                <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Watering</h3>
                <div className="space-y-2">
                  {["low", "medium", "high"].map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="watering" value={val} checked={filters.watering === val} onChange={(e) => updateFilter("watering", e.target.value)} className="accent-[#E85A3C]" />
                      <span className="text-sm text-forest-700">{val === "low" ? "Low (Drought Tolerant)" : val === "medium" ? "Medium (Weekly)" : "High (Frequently)"}</span>
                    </label>
                  ))}
                  {filters.watering && <button onClick={() => updateFilter("watering", "")} className="text-xs text-forest-500 underline mt-1">Clear selection</button>}
                </div>
              </div>
              {hasActiveFilters && <button onClick={clearFilters} className="w-full py-2 text-sm font-mono text-forest-600 border border-forest-300 rounded hover:bg-forest-100 transition-colors">Clear All Filters</button>}
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-4">
              <p className="font-mono text-sm text-forest-500">Showing {filteredProducts.length} plant{filteredProducts.length !== 1 ? "s" : ""}</p>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg border border-forest-200">
                <p className="text-forest-600 text-lg mb-2">No plants match your filters.</p>
                <button onClick={clearFilters} className="text-[#E85A3C] underline font-medium">Clear all filters</button>
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
