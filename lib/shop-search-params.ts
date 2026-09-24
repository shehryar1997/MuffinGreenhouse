// Turns a shop grid page's URL query into filter params: shared by "All plants" and the Discount Sale page.
import type { FilterParams } from "@/lib/data/products"

export type ShopSearchParams = {
  page?: string
  light?: 'low' | 'medium' | 'bright' | 'full_sun'
  water?: 'low' | 'medium' | 'high'
  pets?: 'yes' | 'no'
  min?: string
  max?: string
  stock?: 'in'
  sort?: 'featured' | 'new' | 'price-asc' | 'price-desc' | 'name'
}

export function parseShopFilters(params: ShopSearchParams): FilterParams {
  const filters: FilterParams = {}
  if (params.light && ['low', 'medium', 'bright', 'full_sun'].includes(params.light)) filters.light = params.light
  if (params.water && ['low', 'medium', 'high'].includes(params.water)) filters.water = params.water
  if (params.pets && ['yes', 'no'].includes(params.pets)) filters.pets = params.pets
  if (params.min) {
    const min = parseInt(params.min, 10)
    if (!isNaN(min) && min >= 0) filters.min = min
  }
  if (params.max) {
    const max = parseInt(params.max, 10)
    if (!isNaN(max) && max >= 0) filters.max = max
  }
  if (params.stock === 'in') filters.stock = 'in'
  if (params.sort && ['featured', 'new', 'price-asc', 'price-desc', 'name'].includes(params.sort)) filters.sort = params.sort
  return filters
}
