import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { redirect } from "next/navigation"
import { PRODUCTS_PER_PAGE, type FilterParams } from "@/lib/data/products"
import { getPaginatedProducts, getPriceBounds } from "@/lib/data/catalog"
import { ShopAllClient } from "./shop-all-client"

export const revalidate = 300

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string; [key: string]: string | undefined }> }): Promise<Metadata> {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1)
  const filtered = Object.keys(sp).some((k) => k !== "page")
  // An empty shop is a thin page: keep it out of search until something is on sale.
  const { totalCount } = await getPaginatedProducts(1, 1)
  return pageMetadata({
    title: page > 1 ? `Buy Indoor Plants Online in Pakistan (page ${page})` : "Buy Indoor Plants Online in Pakistan",
    description: "Browse every plant in stock: aroids, hoyas, sansevierias, agaves and more, sourced worldwide and propagated in Karachi. Delivered across Pakistan.",
    path: page > 1 && !filtered ? `/shop/all?page=${page}` : "/shop/all",
    noindex: totalCount === 0,
  })
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
    sort?: 'featured' | 'new' | 'price-asc' | 'price-desc' | 'name'
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
  if (params.sort && ['featured', 'new', 'price-asc', 'price-desc', 'name'].includes(params.sort)) {
    filters.sort = params.sort
  }

  const { products, totalCount } = await getPaginatedProducts(requestedPage, PRODUCTS_PER_PAGE, filters)
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PER_PAGE))

  if (requestedPage > totalPages && totalPages > 0 && totalCount > 0) {
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

