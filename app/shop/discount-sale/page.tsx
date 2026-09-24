import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { pageMetadata } from "@/lib/seo"
import { PRODUCTS_PER_PAGE } from "@/lib/data/products"
import { getPaginatedProducts, getPriceBounds } from "@/lib/data/catalog"
import { parseShopFilters, type ShopSearchParams } from "@/lib/shop-search-params"
import { ShopAllClient } from "../all/shop-all-client"

export const revalidate = 300

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string; [key: string]: string | undefined }> }): Promise<Metadata> {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1)
  const filtered = Object.keys(sp).some((k) => k !== "page")
  // What is on sale changes constantly, and an empty sale page is a thin page: keep it out of search until it has plants.
  const { totalCount } = await getPaginatedProducts(1, 1, { sale: true })
  return pageMetadata({
    title: page > 1 ? `Plants on Sale in Pakistan (page ${page})` : "Plants on Sale in Pakistan",
    description: "Discounted plants at reduced prices: aroids, hoyas, sansevierias and more, grown in Karachi and delivered across Pakistan.",
    path: page > 1 && !filtered ? `/shop/discount-sale?page=${page}` : "/shop/discount-sale",
    noindex: totalCount === 0,
  })
}

export default async function DiscountSalePage({ searchParams }: { searchParams: Promise<ShopSearchParams> }) {
  const params = await searchParams
  const requestedPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  // The grid gets only the filters the shopper chose; "on sale" is this page's own rule, not a filter chip.
  const filters = parseShopFilters(params)

  const { products, totalCount } = await getPaginatedProducts(requestedPage, PRODUCTS_PER_PAGE, { ...filters, sale: true })
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PER_PAGE))

  if (requestedPage > totalPages && totalCount > 0) {
    redirect(totalPages > 1 ? `/shop/discount-sale?page=${totalPages}` : "/shop/discount-sale")
  }

  const priceBounds = await getPriceBounds()

  return (
    <ShopAllClient
      mode="sale"
      products={products}
      currentPage={requestedPage}
      totalPages={totalPages}
      totalCount={totalCount}
      filters={filters}
      priceBounds={priceBounds}
    />
  )
}
