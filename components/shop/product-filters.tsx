"use client"

import { useState, useMemo, ReactNode, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { ChevronDown, Search, X } from "lucide-react"
import type { Product } from "@/types"
import { isPlantProduct } from "@/lib/product-categories"
import { cn, debounce } from "@/lib/utils"
import type { FilterParams } from "@/lib/data/products"

export const MAX_PRICE = 250000

export interface FilterState extends FilterParams {
  priceRange?: [number, number]
}

interface ProductFiltersProps {
  products: Product[]
  children: (filteredProducts: Product[], filterState: FilterStateHelpers) => ReactNode
  initialFilters?: FilterParams
  priceBounds?: { min: number; max: number }
}

export interface FilterStateHelpers {
  filters: FilterState
  /** Top of the price slider: the priciest product on the page, rounded up (was a fixed 250,000). */
  maxPrice: number
  hasActiveFilters: boolean
  updateFilter: (key: keyof FilterParams, value: string | number | [number, number] | undefined) => void
  clearFilters: () => void
  activeFilterChips: React.ReactNode[]
}

const defaultFilters: FilterState = {
  priceRange: [0, MAX_PRICE]
}

export function ProductFilters({ products, children, initialFilters, priceBounds }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...initialFilters,
    priceRange: initialFilters?.min !== undefined || initialFilters?.max !== undefined 
      ? [initialFilters.min || 0, initialFilters.max || MAX_PRICE]
      : [0, MAX_PRICE]
  }))

  // The stored upper bound starts at MAX_PRICE ("no limit"), so it stays valid as the catalog changes.
  const maxPrice = useMemo(() => {
    if (priceBounds) return Math.max(priceBounds.max, 1000)
    const priciest = products.reduce((max, p) => Math.max(max, p.price), 0)
    return Math.min(MAX_PRICE, Math.max(1000, Math.ceil(priciest / 500) * 500))
  }, [products, priceBounds])

  // Update URL when filters change (debounced for price slider)
  const updateUrl = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams(searchParams.toString())
    // Remove page param when filters change
    params.delete("page")
    
    // Update params based on filters
    if (newFilters.light) params.set("light", newFilters.light)
    else params.delete("light")
    
    if (newFilters.water) params.set("water", newFilters.water)
    else params.delete("water")
    
    if (newFilters.pets) params.set("pets", newFilters.pets)
    else params.delete("pets")
    
    if (newFilters.min !== undefined) params.set("min", newFilters.min.toString())
    else params.delete("min")
    
    if (newFilters.max !== undefined) params.set("max", newFilters.max.toString())
    else params.delete("max")
    
    if (newFilters.stock) params.set("stock", newFilters.stock)
    else params.delete("stock")
    
    if (newFilters.sort) params.set("sort", newFilters.sort)
    else params.delete("sort")
    
    const queryString = params.toString()
    router.replace(`?${queryString}`, { scroll: false })
  }, [router, searchParams])

  const debouncedUpdateUrl = useMemo(() => debounce(updateUrl, 300), [updateUrl])

  const updateFilter = useCallback((key: keyof FilterParams, value: string | number | [number, number] | undefined) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      
      if (key === 'min' || key === 'max') {
        if (value === undefined) {
          delete newFilters[key]
        } else {
          newFilters[key] = value as number
        }
        // Update priceRange for UI consistency
        newFilters.priceRange = [
          newFilters.min !== undefined ? newFilters.min : 0,
          newFilters.max !== undefined ? newFilters.max : MAX_PRICE
        ]
      } else if (key === 'min' || key === 'max') {
        if (value === '' || value === undefined) {
          delete newFilters[key]
        } else {
          newFilters[key] = value as number
        }
        // Update priceRange for UI consistency
        newFilters.priceRange = [
          newFilters.min !== undefined ? newFilters.min : 0,
          newFilters.max !== undefined ? newFilters.max : MAX_PRICE
        ]
      } else if (key === 'priceRange') {
        const [min, max] = value as [number, number]
        newFilters.min = min > 0 ? min : undefined
        newFilters.max = max < MAX_PRICE ? max : undefined
        newFilters.priceRange = [min, max]
      } else {
        if (value === '' || value === undefined) {
          delete newFilters[key]
        } else {
          newFilters[key] = value as string
        }
      }
      
      // Debounce URL update for price slider, immediate for others
      if (key === 'priceRange' || key === 'min' || key === 'max') {
        debouncedUpdateUrl(newFilters)
      } else {
        updateUrl(newFilters)
      }
      
      return newFilters
    })
  }, [debouncedUpdateUrl, updateUrl])

  const clearFilters = useCallback(() => {
    setFilters({ priceRange: [0, MAX_PRICE] })
    router.replace(`?`, { scroll: false })
  }, [router])

  const hasActiveFilters = Boolean(
    filters.light ||
    filters.water ||
    filters.pets ||
    (filters.min !== undefined && filters.min > 0) ||
    (filters.max !== undefined && filters.max < maxPrice) ||
    filters.stock ||
    filters.sort
  )

  

  const activeFilterChips = useMemo(() => {
    const chips: React.ReactNode[] = []
    
    if (filters.light) {
      const label = filters.light === 'low' ? 'Low Light' : 
                   filters.light === 'medium' ? 'Medium Light' :
                   filters.light === 'bright' ? 'Bright Indirect' : 'Full Sun'
      chips.push(
        <button
          key="light"
          onClick={() => updateFilter('light', undefined)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-forest-100 text-forest-700 text-sm rounded-full hover:bg-forest-200 transition-colors"
        >
          Light: {label}
          <X className="w-3 h-3" />
        </button>
      )
    }
    
    if (filters.water) {
      const label = filters.water === 'low' ? 'Low Water' :
                   filters.water === 'medium' ? 'Medium Water' : 'High Water'
      chips.push(
        <button
          key="water"
          onClick={() => updateFilter('water', undefined)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-forest-100 text-forest-700 text-sm rounded-full hover:bg-forest-200 transition-colors"
        >
          Water: {label}
          <X className="w-3 h-3" />
        </button>
      )
    }
    
    if (filters.pets) {
      const label = filters.pets === 'yes' ? 'Pet Safe' : 'Not Pet Safe'
      chips.push(
        <button
          key="pets"
          onClick={() => updateFilter('pets', undefined)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-forest-100 text-forest-700 text-sm rounded-full hover:bg-forest-200 transition-colors"
        >
          {label}
          <X className="w-3 h-3" />
        </button>
      )
    }
    
    if (filters.min !== undefined && filters.min > 0) {
      chips.push(
        <button
          key="min"
          onClick={() => updateFilter('min', undefined)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-forest-100 text-forest-700 text-sm rounded-full hover:bg-forest-200 transition-colors"
        >
          Min: {filters.min.toLocaleString()} PKR
          <X className="w-3 h-3" />
        </button>
      )
    }
    
    if (filters.max !== undefined && filters.max < maxPrice) {
      chips.push(
        <button
          key="max"
          onClick={() => updateFilter('max', undefined)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-forest-100 text-forest-700 text-sm rounded-full hover:bg-forest-200 transition-colors"
        >
          Max: {filters.max.toLocaleString()} PKR
          <X className="w-3 h-3" />
        </button>
      )
    }
    
    if (filters.stock) {
      chips.push(
        <button
          key="stock"
          onClick={() => updateFilter('stock', undefined)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-forest-100 text-forest-700 text-sm rounded-full hover:bg-forest-200 transition-colors"
        >
          In Stock Only
          <X className="w-3 h-3" />
        </button>
      )
    }
    
    if (filters.sort && filters.sort !== 'new') {
      const label = filters.sort === 'price-asc' ? 'Price: Low to High' :
                   filters.sort === 'price-desc' ? 'Price: High to Low' : 'Name: A to Z'
      chips.push(
        <button
          key="sort"
          onClick={() => updateFilter('sort', undefined)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-forest-100 text-forest-700 text-sm rounded-full hover:bg-forest-200 transition-colors"
        >
          {label}
          <X className="w-3 h-3" />
        </button>
      )
    }
    
    return chips
  }, [filters, maxPrice, updateFilter])

  const filterHelpers: FilterStateHelpers = {
    filters,
    maxPrice,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    activeFilterChips,
  }

  // No client-side filtering - products are already filtered server-side
  return <>{children(products, filterHelpers)}</>
}

type FilterSidebarProps = {
  filters: FilterState
  maxPrice?: number
  hasActiveFilters: boolean
  updateFilter: (key: keyof FilterParams, value: string | number | [number, number] | undefined) => void
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
        {/* Search removed - covered by K5 */}

        <div>
          <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Price Range (PKR)</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm font-mono text-forest-600">
              <span>PKR {lower.toLocaleString()}</span>
              <span>PKR {upper.toLocaleString()}</span>
            </div>
            <Slider
              value={[lower, upper]}
              max={maxPrice}
              step={maxPrice <= 20000 ? 100 : 1000}
              onValueChange={(value: [number, number]) => updateFilter("priceRange", value)}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Stock Status</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="stock"
                checked={filters.stock === 'in'}
                onChange={(e) => updateFilter("stock", e.target.checked ? 'in' : undefined)}
                className="accent-clay-500"
              />
              <span className="text-sm text-forest-700">In Stock Only</span>
            </label>
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
                      checked={filters.light === val}
                      onChange={(e) => updateFilter("light", e.target.checked ? val : undefined)}
                      className="accent-clay-500"
                    />
                    <span className="text-sm text-forest-700">
                      {val === "low" ? "Low Light" : val === "medium" ? "Medium Light" : val === "bright" ? "Bright Indirect" : "Full Sun"}
                    </span>
                  </label>
                ))}
                {filters.light && (
                  <button onClick={() => updateFilter("light", undefined)} className="text-xs text-forest-500 underline mt-1">
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
                      checked={filters.pets === val}
                      onChange={(e) => updateFilter("pets", e.target.checked ? val : undefined)}
                      className="accent-clay-500"
                    />
                    <span className="text-sm text-forest-700">{val === "yes" ? "Yes" : "No"}</span>
                  </label>
                ))}
                {filters.pets && (
                  <button onClick={() => updateFilter("pets", undefined)} className="text-xs text-forest-500 underline mt-1">
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
                      checked={filters.water === val}
                      onChange={(e) => updateFilter("water", e.target.checked ? val : undefined)}
                      className="accent-clay-500"
                    />
                    <span className="text-sm text-forest-700">
                      {val === "low" ? "Low (Drought Tolerant)" : val === "medium" ? "Medium (Weekly)" : "High (Frequently)"}
                    </span>
                  </label>
                ))}
                {filters.water && (
                  <button onClick={() => updateFilter("water", undefined)} className="text-xs text-forest-500 underline mt-1">
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
