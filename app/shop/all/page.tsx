import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getPaginatedProducts, PRODUCTS_PER_PAGE, FilterParams, getPriceBounds } from "@/lib/data/products"
import { ShopAllClient } from "./shop-all-client"

export const revalidate = 300

export const metadata: Metadata = {
  title: "All Plants",
  description: "Browse our full collection of indoor plants sourced worldwide and propagated in Karachi. Home delivery available in Karachi and across Pakistan.",
  alternates: { canonical: "/shop/all" },
}

interface ShopAllPageProps {
  searchParams: Promise<{ 
    page?: string
    light?: 'low' | 'medium' | 'bright' | 'full_sun'
    water?: 'low' | 'medium' | 'high'
    pets?: 'yes' | 'no'
    min?: string
    max?: string
    stock?: 'in'
    sort?: 'new' | 'price-asc' | 'price-desc' | 'name'
  }>
}

export default async function ShopAllPage({ searchParams }: ShopAllPageProps) {
  const params = await searchParams
  const requestedPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  
  // Build filter params from search params
  const filters: FilterParams = {}
  if (params.light && ['low', 'medium', 'bright', 'full_sun'].includes(params.light)) {
    filters.light = params.light
  }
  if (params.water && ['low', 'medium', 'high'].includes(params.water)) {
    filters.water = params.water
  }
  if (params.pets && ['yes', 'no'].includes(params.pets)) {
    filters.pets = params.pets
  }
  if (params.min) {
    const min = parseInt(params.min, 10)
    if (!isNaN(min) && min >= 0) filters.min = min
  }
  if (params.max) {
    const max = parseInt(params.max, 10)
    if (!isNaN(max) && max >= 0) filters.max = max
  }
  if (params.stock === 'in') {
    filters.stock = 'in'
  }
  if (params.sort && ['new', 'price-asc', 'price-desc', 'name'].includes(params.sort)) {
    filters.sort = params.sort
  }

  const { products, totalCount } = await getPaginatedProducts(requestedPage, PRODUCTS_PER_PAGE, filters)
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PER_PAGE))

  if (requestedPage > totalPages && totalPages > 0) {
    redirect(totalPages > 1 ? `/shop/all?page=${totalPages}` : "/shop/all")
  }

  // Get price bounds for the price slider
  const priceBounds = await getPriceBounds()

  return <ShopAllClient 
    products={products} 
    currentPage={requestedPage} 
    totalPages={totalPages} 
    totalCount={totalCount}
    filters={filters}
    priceBounds={priceBounds}
  />
}

