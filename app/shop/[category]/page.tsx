import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { PRODUCTS_PER_PAGE, type FilterParams } from "@/lib/data/products"
import { getPaginatedProductsByCategory, getPriceBounds } from "@/lib/data/catalog"
import { getCategoryCopy } from "@/lib/data/categories"
import { ShopCategoryClient } from "./shop-category-client"
import { MAX_PRICE } from "@/components/shop/product-filters"
import { Markdown } from "@/components/journal/markdown"
import { isNonPlantCategorySlug } from "@/lib/product-categories"
import { pageMetadata } from "@/lib/seo"

export const revalidate = 300

type SearchParams = {
  page?: string
  light?: 'low' | 'medium' | 'bright' | 'full_sun'
  water?: 'low' | 'medium' | 'high'
  pets?: 'yes' | 'no'
  min?: string
  max?: string
  stock?: 'in'
  sort?: 'featured' | 'new' | 'price-asc' | 'price-desc' | 'name'
}

function readFilters(paramsObj: SearchParams): FilterParams {
  const filters: FilterParams = {}
  if (paramsObj.light && ['low', 'medium', 'bright', 'full_sun'].includes(paramsObj.light)) filters.light = paramsObj.light
  if (paramsObj.water && ['low', 'medium', 'high'].includes(paramsObj.water)) filters.water = paramsObj.water
  if (paramsObj.pets && ['yes', 'no'].includes(paramsObj.pets)) filters.pets = paramsObj.pets
  if (paramsObj.min) {
    const min = parseInt(paramsObj.min, 10)
    if (!isNaN(min) && min >= 0) filters.min = min
  }
  if (paramsObj.max) {
    const max = parseInt(paramsObj.max, 10)
    if (!isNaN(max) && max >= 0) filters.max = max
  }
  if (paramsObj.stock === 'in') filters.stock = 'in'
  if (paramsObj.sort && ['featured', 'new', 'price-asc', 'price-desc', 'name'].includes(paramsObj.sort)) filters.sort = paramsObj.sort
  return filters
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const { category } = await params
  const sp = await searchParams
  const copy = await getCategoryCopy(category)
  if (!copy) return { title: "Category not found", robots: { index: false, follow: true } }

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1)
  const filtered = Object.keys(readFilters(sp)).length > 0
  // An empty category is a thin page: keep it out of search until something is on sale.
  const { totalCount } = await getPaginatedProductsByCategory(category, 1, 1)
  const title = copy.metaTitle || `${copy.title} for Sale in Pakistan`
  return pageMetadata({
    title: page > 1 ? `${title} (page ${page})` : title,
    description: copy.metaDescription || copy.description,
    // Each page of a long category is its own page for search engines; filtered/sorted views point at the plain list.
    path: page > 1 && !filtered ? `/shop/${category}?page=${page}` : `/shop/${category}`,
    noindex: totalCount === 0,
  })
}

interface ShopCategoryPageProps {
  params: Promise<{ category: string }>
  searchParams: Promise<SearchParams>
}

export default async function ShopCategoryPage({ params, searchParams }: ShopCategoryPageProps) {
  const { category } = await params
  const paramsObj = await searchParams
  const requestedPage = Math.max(1, parseInt(paramsObj.page ?? "1", 10) || 1)
  const filters = readFilters(paramsObj)

  const [copy, { products, totalCount }] = await Promise.all([
    getCategoryCopy(category),
    getPaginatedProductsByCategory(category, requestedPage, PRODUCTS_PER_PAGE, filters),
  ])
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PER_PAGE))

  // A made-up slug used to render a blank "category" with HTTP 200; only the known categories may be empty.
  if (!copy) notFound()

  if (requestedPage > totalPages && totalPages > 0 && totalCount > 0) {
    redirect(totalPages > 1 ? `/shop/${category}?page=${totalPages}` : `/shop/${category}`)
  }

  // Price bounds for the price slider (plant categories only)
  const isPlantCategory = !isNonPlantCategorySlug(category)
  const priceBounds = isPlantCategory ? await getPriceBounds() : { min: 0, max: MAX_PRICE }

  return (
    <ShopCategoryClient
      products={products}
      meta={{ title: copy.title, description: copy.description, tagline: copy.tagline }}
      categorySlug={category}
      currentPage={requestedPage}
      totalPages={totalPages}
      totalCount={totalCount}
      filters={filters}
      priceBounds={priceBounds}
      guide={copy.intro && requestedPage === 1 ? <Markdown source={copy.intro} /> : null}
    />
  )
}
