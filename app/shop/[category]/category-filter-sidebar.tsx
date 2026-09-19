"use client"

import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Search } from "lucide-react"

const MAX_PRICE = 250000

interface FilterState {
  searchQuery: string
  priceRange: [number, number]
  lighting: string
  petFriendly: string
  watering: string
}

interface CategoryFilterSidebarProps {
  filters: FilterState
  hasActiveFilters: boolean
  updateFilter: (key: keyof FilterState, value: string | [number, number]) => void
  clearFilters: () => void
  isPlantCategory: boolean
}

function PlantFilters({ filters, updateFilter }: { filters: FilterState; updateFilter: (key: keyof FilterState, value: string | [number, number]) => void }) {
  return (
    <>
      <div>
        <h3 className="font-mono text-xs-tracking-widest text-forest-600 uppercase mb-3">Search</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-500" />
          <Input
            placeholder="Search plants..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            value={filters.priceRange}
            onValueChange={(v) => updateFilter("priceRange", v as [number, number])}
            min={0}
            max={MAX_PRICE}
            step={1000}
          />
          <div className="flex justify-between mt-2 text-sm text-forest-600">
            <span>PKR {filters.priceRange[0].toLocaleString()}</span>
            <span>PKR {filters.priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-mono text-xs tracking-widest text-forest-600 uppercase mb-3">Lighting</h3>
        <div className="space-y-2">
          {["low", "medium", "bright", "direct"].map((val) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="lighting"
                value={val}
                checked={filters.lighting === val}
                onChange={(e) => updateFilter("lighting", e.target.value)}
                className="accent-clay-500"
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
                className="accent-clay-500"
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
                className="accent-clay-500"
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
  )
}

export function CategoryFilterSidebar({
  filters,
  hasActiveFilters,
  updateFilter,
  clearFilters,
  isPlantCategory,
}: CategoryFilterSidebarProps) {
  return (
    <aside className="w-full lg:w-64 lg:flex-shrink-0">
      <div className="sticky top-4 space-y-6">
        {isPlantCategory && (
          <PlantFilters filters={filters} updateFilter={updateFilter} />
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full py-2 text-sm font-mono text-forest-600 border border-forest-300 rounded hover:bg-forest-100 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
    </aside>
  )
}
