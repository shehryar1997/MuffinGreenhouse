// Product data access layer - wraps mock data for easy Supabase migration
import { Product } from "@/types"
import {
  mockProducts,
  getProductBySlug as _getProductBySlug,
  getProductsByCategory as _getProductsByCategory,
  getProductsByUseCase as _getProductsByUseCase,
  getWeeklySoldCount as _getWeeklySoldCount,
  plantOfTheDay,
} from "@/data/mock-products"

export { mockProducts, plantOfTheDay }

// ponytail: Wrapper functions that delegate to mock-products.ts
// When we move to Supabase, only these functions need updating

export function getAllProducts(): Product[] {
  return mockProducts
}

export function getProductBySlug(slug: string): Product | undefined {
  return _getProductBySlug(slug)
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return _getProductsByCategory(categorySlug)
}

export function getProductsByUseCase(useCaseSlug: string): Product[] {
  return _getProductsByUseCase(useCaseSlug)
}

export function getWeeklySoldCount(): number {
  return _getWeeklySoldCount()
}

export function getPlantOfTheDay(): Product {
  return plantOfTheDay
}

// Re-export constants needed by consumers
export { shopByNeedIcons, useCases, categoryMeta, mockReviews } from "@/data/mock-products"
