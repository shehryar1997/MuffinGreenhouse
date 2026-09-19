import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getPaginatedProducts, PRODUCTS_PER_PAGE } from "@/lib/data/products"
import { ShopAllClient } from "./shop-all-client"

export const revalidate = 300

export const metadata: Metadata = {
  title: "All Plants",
  description: "Browse our full collection of locally grown indoor plants. Home delivery available in Karachi and across Pakistan.",
  alternates: { canonical: "/shop/all" },
}

interface ShopAllPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function ShopAllPage({ searchParams }: ShopAllPageProps) {
  const { page } = await searchParams
  const requestedPage = Math.max(1, parseInt(page ?? "1", 10) || 1)
  const { products, totalCount } = await getPaginatedProducts(requestedPage, PRODUCTS_PER_PAGE)
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PER_PAGE))

  if (requestedPage > totalPages) {
    redirect(totalPages > 1 ? `/shop/all?page=${totalPages}` : "/shop/all")
  }

  return <ShopAllClient products={products} currentPage={requestedPage} totalPages={totalPages} />
}

