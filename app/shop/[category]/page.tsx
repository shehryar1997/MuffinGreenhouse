import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getPaginatedProductsByCategory, categoryMeta, PRODUCTS_PER_PAGE, FilterParams, getPriceBounds } from "@/lib/data/products"
import { ShopCategoryClient } from "./shop-category-client"
import { MAX_PRICE } from "@/components/shop/product-filters"

export const revalidate = 300

// SEO-optimized metadata for category pages
const categoryMetadata: Record<string, { title: string; description: string }> = {
  aroids: {
    title: "Aroids - Monstera, Philodendron & More",
    description: "Rare and common aroids including Monstera, Philodendron, and Syngonium. Acclimated for Karachi climate. Shop online with home delivery.",
  },
  sansevierias: {
    title: "Snake Plants & Sansevierias",
    description: "Hard-to-kill sansevierias perfect for Karachi heat and low light. Air-purifying and drought tolerant. Order online with delivery.",
  },
  agaves: {
    title: "Agaves & Succulents",
    description: "Bold, architectural agaves for sunny balconies and gardens in Karachi. Desert plants ready for Pakistani climate. Shop online now.",
  },
  mangaves: {
    title: "Mangaves - Hybrid Agaves",
    description: "Fast-growing mangave hybrids combining agave hardiness with colorful patterns. Perfect for Karachi rooftop gardens. Order online.",
  },
  hoyas: {
    title: "Hoya Plants & Wax Vines",
    description: "Trailing hoyas with waxy leaves and fragrant star flowers. Great for hanging baskets in Karachi homes. Shop online with delivery.",
  },
  orchids: {
    title: "Orchids for Sale",
    description: "Exquisite phalaenopsis and dendrobium orchids for Karachi homes. Tropical elegance with care guidance included. Order online.",
  },
  "cacti-succulents": {
    title: "Cacti & Succulents",
    description: "Hardy cacti and succulents for sunny windows, balconies and desks in Karachi. Low-water plants delivered across Pakistan. Shop online.",
  },
  "planting-media": {
    title: "Potting Soil & Planting Media",
    description: "Premium coco coir, perlite, vermiculite, and custom soil mixes for indoor plants. Available for delivery across Karachi and Pakistan.",
  },
  fertilizer: {
    title: "Plant Fertilizers & Nutrients",
    description: "Liquid feeds, slow-release pellets, and organic fertilizers for healthy plants. Shop online with delivery in Karachi and Pakistan.",
  },
  pots: {
    title: "Plant Pots & Planters",
    description: "Ceramic, terracotta, and decorative pots in all sizes. Find the perfect planter for your plants. Delivery available in Karachi.",
  },
  "other-equipment": {
    title: "Plant Care Tools & Equipment",
    description: "Misters, pruners, humidity trays, and everything plant parents need. Shop gardening tools online with Karachi delivery.",
  },
  all: {
    title: "All Plants & Supplies",
    description: "Browse our full collection of indoor plants sourced worldwide and propagated in Karachi, pots, fertilizers, and tools. Home delivery available in Karachi and across Pakistan.",
  },
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params
  const meta = categoryMetadata[category] || {
    title: `${category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ")}`,
    description: "Browse our collection of quality plants for Karachi.",
  }
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/shop/${category}` },
  }
}

interface ShopCategoryPageProps {
  params: Promise<{ category: string }>
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

export default async function ShopCategoryPage({ params, searchParams }: ShopCategoryPageProps) {
  const { category } = await params
  const paramsObj = await searchParams
  const requestedPage = Math.max(1, parseInt(paramsObj.page ?? "1", 10) || 1)
  
  // Build filter params from search params
  const filters: FilterParams = {}
  if (paramsObj.light && ['low', 'medium', 'bright', 'full_sun'].includes(paramsObj.light)) {
    filters.light = paramsObj.light
  }
  if (paramsObj.water && ['low', 'medium', 'high'].includes(paramsObj.water)) {
    filters.water = paramsObj.water
  }
  if (paramsObj.pets && ['yes', 'no'].includes(paramsObj.pets)) {
    filters.pets = paramsObj.pets
  }
  if (paramsObj.min) {
    const min = parseInt(paramsObj.min, 10)
    if (!isNaN(min) && min >= 0) filters.min = min
  }
  if (paramsObj.max) {
    const max = parseInt(paramsObj.max, 10)
    if (!isNaN(max) && max >= 0) filters.max = max
  }
  if (paramsObj.stock === 'in') {
    filters.stock = 'in'
  }
  if (paramsObj.sort && ['new', 'price-asc', 'price-desc', 'name'].includes(paramsObj.sort)) {
    filters.sort = paramsObj.sort
  }

  const { products, totalCount } = await getPaginatedProductsByCategory(category, requestedPage, PRODUCTS_PER_PAGE, filters)
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PER_PAGE))

  // A made-up slug used to render a blank "category" with HTTP 200; only the known categories may be empty.
  if (totalCount === 0 && !categoryMeta[category]) notFound()

  if (requestedPage > totalPages && totalPages > 0) {
    redirect(totalPages > 1 ? `/shop/${category}?page=${totalPages}` : `/shop/${category}`)
  }

  const categoryDisplayMeta = categoryMeta[category] || {
    title: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " "),
    description: "Browse our collection.",
    tagline: "Quality plants for Karachi.",
  }
  
  // Get price bounds for the price slider (only for plant categories)
  const isPlantCategory = !['fertilizer', 'other-equipment', 'pots', 'planting-media'].includes(category)
  const priceBounds = isPlantCategory ? await getPriceBounds() : { min: 0, max: MAX_PRICE }

  return (
    <ShopCategoryClient
      products={products}
      meta={categoryDisplayMeta}
      categorySlug={category}
      currentPage={requestedPage}
      totalPages={totalPages}
      totalCount={totalCount}
      filters={filters}
      priceBounds={priceBounds}
    />
  )
}
