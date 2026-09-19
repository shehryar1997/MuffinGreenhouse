// Light filtering utilities for plant recommendations
// ponytail: This module can be swapped with the full Plant Finder matching function later

import { Product } from "@/types"
import { isPlantProduct } from "@/lib/product-categories"

export type LightLevel = "low" | "medium" | "bright"

export const lightLevelLabels: Record<LightLevel, string> = {
  low: "Low light",
  medium: "Medium light",
  bright: "Bright light",
}

/**
 * Filter products by light level requirement.
 * ponytail: Simple tag matching - can be replaced with full Plant Finder matching later
 * 
 * Maps lightRequirement values:
 * - "low" → "low"
 * - "medium" → "medium"  
 * - "bright" | "full_sun" → "bright"
 */
export function filterProductsByLight(products: Product[], lightLevel: LightLevel): Product[] {
  return products.filter((product) => {
    if (!isPlantProduct(product)) return false
    const requirement = product.lightRequirement
    
    // Map full_sun to bright for our three-category system
    if (lightLevel === "bright") {
      return requirement === "bright" || requirement === "full_sun"
    }
    
    return requirement === lightLevel
  })
}

/**
 * Get a subset of products for the light filter preview.
 * Returns up to 3 products, prioritizing in-stock items.
 */
export function getLightPreviewProducts(products: Product[], lightLevel: LightLevel, limit: number = 3): Product[] {
  const filtered = filterProductsByLight(products, lightLevel)
  
  // Sort: in-stock first, then by name
  const sorted = [...filtered].sort((a, b) => {
    // Prioritize in-stock
    if (a.stockStatus === "out_of_stock" && b.stockStatus !== "out_of_stock") return 1
    if (a.stockStatus !== "out_of_stock" && b.stockStatus === "out_of_stock") return -1
    return a.name.localeCompare(b.name)
  })
  
  return sorted.slice(0, limit)
}
