import { redirect } from "next/navigation"
import { getPaginatedProductsByCategory, categoryMeta, PRODUCTS_PER_PAGE } from "@/lib/data/products"
import { ShopCategoryClient } from "./shop-category-client"

export const revalidate = 300

interface ShopCategoryPageProps {
  params: { category: string }
  searchParams: { page?: string }
}

export default async function ShopCategoryPage({ params, searchParams }: ShopCategoryPageProps) {
  const requestedPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1)
  const { products, totalCount } = await getPaginatedProductsByCategory(params.category, requestedPage, PRODUCTS_PER_PAGE)
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PER_PAGE))

  if (requestedPage > totalPages) {
    redirect(totalPages > 1 ? `/shop/${params.category}?page=${totalPages}` : `/shop/${params.category}`)
  }

  const meta = categoryMeta[params.category] || {
    title: params.category.charAt(0).toUpperCase() + params.category.slice(1).replace(/-/g, " "),
    description: "Browse our collection.",
    tagline: "Quality plants for Karachi.",
  }
  return (
    <ShopCategoryClient
      products={products}
      meta={meta}
      categorySlug={params.category}
      currentPage={requestedPage}
      totalPages={totalPages}
    />
  )
}
