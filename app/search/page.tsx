import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SearchPageClient } from "./search-page-client"
import { searchProducts } from "@/lib/data/products"
import { sanitizeSearchTerm } from "@/lib/search-term"
import { shopByNeedCategories } from "@/config/nav.config"

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  const query = q ? sanitizeSearchTerm(q) : ""
  
  if (!query) {
    return {
      title: "Search | Muffin",
      description: "Search for plants at Muffin Nursery",
      robots: { index: false }
    }
  }
  
  return {
    title: `Search: "${query}" | Muffin`,
    description: `Search results for "${query}" at Muffin Nursery`,
    robots: { index: false }
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, page } = await searchParams
  const query = q ? sanitizeSearchTerm(q) : ""
  
  if (!query) {
    notFound()
  }
  
  const currentPage = page ? parseInt(page, 10) : 1
  if (isNaN(currentPage) || currentPage < 1) {
    notFound()
  }
  
  const { products, totalCount } = await searchProducts({
    query,
    page: currentPage,
    pageSize: 24,
  })
  
  const totalPages = Math.ceil(totalCount / 24)
  
  // Get popular categories for zero-results state
  const popularCategories = shopByNeedCategories.slice(0, 4)
  
  return (
    <SearchPageClient
      query={query}
      products={products}
      currentPage={currentPage}
      totalPages={totalPages}
      totalCount={totalCount}
      popularCategories={popularCategories}
    />
  )
}