"use client"

import { useState, useMemo, ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { ChevronDown, Search } from "lucide-react"
import type { Product } from "@/types"
import { isPlantProduct } from "@/lib/product-categories"
import { cn } from "@/lib/utils"

export const MAX_PRICE = 250000

export interface FilterState {
  searchQuery: string
  priceRange: [number, number]
  lighting: string
  petFriendly: string
  watering: string
}

interface ProductFiltersProps {
  products: Product[]
  children: (filteredProducts: Product[], filterState: FilterStateHelpers) => ReactNode
}

export interface FilterStateHelpers {
  filters: FilterState
  /** Top of the price slider: the priciest product on the page, rounded up (was a fixed 250,000). */
  maxPrice: number
  hasActiveFilters: boolean
  updateFilter: (key: keyof FilterState, value: string | [number, number]) => void
  clearFilters: () => void
}

const defaultFilters: FilterState = {
  searchQuery: "",
  priceRange: [0, MAX_PRICE],
  lighting: "",
  petFriendly: "",
  watering: "",
}

export function ProductFilters({ products, children }: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  // The stored upper bound starts at MAX_PRICE ("no limit"), so it stays valid as the catalog changes.
  const maxPrice = useMemo(() => {
    const priciest = products.reduce((max, p) => Math.max(max, p.price), 0)
    return Math.min(MAX_PRICE, Math.max(1000, Math.ceil(priciest / 500) * 500))
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((p: Product) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matchesSearch = p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false
      // Equipment rows carry placeholder care values; never let them match a care filter.
      if ((filters.lighting || filters.petFriendly || filters.watering) && !isPlantProduct(p)) return false
      if (filters.lighting && p.lightRequirement !== filters.lighting) return false
      if (filters.petFriendly) {
        const isPetSafe = filters.petFriendly === "yes"
        if (p.isPetSafe !== isPetSafe) return false
      }
      if (filters.watering && p.waterRequirement !== filters.watering) return false
      return true
    })
  }, [products, filters])

  const updateFilter = (key: keyof FilterState, value: string | [number, number]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
  }

  const hasActiveFilters = Boolean(
    filters.searchQuery ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < maxPrice ||
    filters.lighting ||
    filters.petFriendly ||
    filters.watering
  )

  const filterHelpers: FilterStateHelpers = {
    filters,
    maxPrice,
    hasActiveFilters,
    updateFilter,
    clearFilters,
  }

  return <>{children(filteredProducts, filterHelpers)}</>
}

type FilterSidebarProps = {
  filters: FilterState
  maxPrice?: number
  hasActiveFilters: boolean
  updateFilter: (key: keyof FilterState, value: string | [number, number]) => void
  clearFilters: () => void
  showClearButtonText?: string
  hidePlantFilters?: boolean
}

export function FilterSidebar({
  filters,
  maxPrice = MAX_PRICE,
  hasActiveFilters,
  updateFilter,
  clearFilters,
  showClearButtonText = "Clear All Filters",
  hidePlantFilters = false,
}: FilterSidebarProps) {
  // On phones the filters used to sit fully open above the first product (~550 px), pushing every product
  // below the fold. They now collapse behind a button; from lg up they stay open as before.
  const [open, setOpen] = useState(false)
  const upper = Math.min(filters.priceRange[1], maxPrice)
  const activeCount =
    [filters.searchQuery, filters.lighting, filters.petFriendly, filters.watering].filter(Boolean).length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice ? 1 : 0)

  return (
    <aside className="w-full lg:w-64 lg:flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="shop-filters"
        className="flex w-full items-center justify-between rounded-lg border border-forest-200 bg-white px-4 py-3 font-mono text-sm text-forest-700 lg:hidden"
      >
        <span>{activeCount > 0 ? `Filters (${activeCount})` : "Filters"}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      <div id="shop-filters" className={cn("sticky top-4 mt-4 space-y-6 lg:mt-0", !open && "hidden lg:block")}>
        <div>
          <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Search</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-500" />
            <Input
              placeholder="Search plants..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter("searchQuery", e.target.value)}
              className="pl-10 bg-white border-forest-200"
            />
          </div>
        </div>

        <div>
          <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Price Range (PKR)</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm font-mono text-forest-600">
              <span>PKR {filters.priceRange[0].toLocaleString()}</span>
              <span>PKR {upper.toLocaleString()}</span>
            </div>
            <Slider
              value={[filters.priceRange[0], upper]}
              max={maxPrice}
              step={maxPrice <= 20000 ? 100 : 1000}
              onValueChange={(value: [number, number]) => updateFilter("priceRange", value)}
              className="w-full"
            />
          </div>
        </div>

        {!hidePlantFilters && (
          <>
            <div>
              <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Lighting</h3>
              <div className="space-y-2">
                {["low", "medium", "bright", "full_sun"].map((val) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="lighting"
                      value={val}
                      checked={filters.lighting === val}
                      onChange={(e) => updateFilter("lighting", e.target.value)}
                      className="accent-[#E85A3C]"
                    />
                    <span className="text-sm text-forest-700">
                      {val === "low" ? "Low Light" : val === "medium" ? "Medium Light" : val === "bright" ? "Bright Indirect" : "Full Sun"}
                    </span>
                  </label>
                ))}
                {filters.lighting && (
                  <button onClick={() => updateFilter("lighting", "")} className="text-xs text-forest-500 underline mt-1">
                    Clear selection
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Pet-Friendly</h3>
              <div className="space-y-2">
                {["yes", "no"].map((val) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="petFriendly"
                      value={val}
                      checked={filters.petFriendly === val}
                      onChange={(e) => updateFilter("petFriendly", e.target.value)}
                      className="accent-[#E85A3C]"
                    />
                    <span className="text-sm text-forest-700">{val === "yes" ? "Yes" : "No"}</span>
                  </label>
                ))}
                {filters.petFriendly && (
                  <button onClick={() => updateFilter("petFriendly", "")} className="text-xs text-forest-500 underline mt-1">
                    Clear selection
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Watering</h3>
              <div className="space-y-2">
                {["low", "medium", "high"].map((val) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="watering"
                      value={val}
                      checked={filters.watering === val}
                      onChange={(e) => updateFilter("watering", e.target.value)}
                      className="accent-[#E85A3C]"
                    />
                    <span className="text-sm text-forest-700">
                      {val === "low" ? "Low (Drought Tolerant)" : val === "medium" ? "Medium (Weekly)" : "High (Frequently)"}
                    </span>
                  </label>
                ))}
                {filters.watering && (
                  <button onClick={() => updateFilter("watering", "")} className="text-xs text-forest-500 underline mt-1">
                    Clear selection
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full py-2 text-sm font-mono text-forest-600 border border-forest-300 rounded hover:bg-forest-100 transition-colors"
          >
            {showClearButtonText}
          </button>
        )}
      </div>
    </aside>
  )
}
