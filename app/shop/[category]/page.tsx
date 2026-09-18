import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getPaginatedProductsByCategory, categoryMeta, PRODUCTS_PER_PAGE } from "@/lib/data/products"
import { ShopCategoryClient } from "./shop-category-client"

export const revalidate = 300

// SEO-optimized metadata for category pages
const categoryMetadata: Record<string, { title: string; description: string }> = {
  aroids: {
    title: "Aroids - Monstera, Philodendron & More - Muffin Greenhouse",
    description: "Rare and common aroids including Monstera, Philodendron, and Syngonium. Acclimated for Karachi climate. Shop online with home delivery.",
  },
  sansevierias: {
    title: "Snake Plants & Sansevierias - Muffin Greenhouse",
    description: "Hard-to-kill sansevierias perfect for Karachi heat and low light. Air-purifying and drought tolerant. Order online with delivery.",
  },
  agaves: {
    title: "Agaves & Succulents - Muffin Greenhouse",
    description: "Bold, architectural agaves for sunny balconies and gardens in Karachi. Desert plants ready for Pakistani climate. Shop online now.",
  },
  mangaves: {
    title: "Mangaves - Hybrid Agaves - Muffin Greenhouse",
    description: "Fast-growing mangave hybrids combining agave hardiness with colorful patterns. Perfect for Karachi rooftop gardens. Order online.",
  },
  hoyas: {
    title: "Hoya Plants & Wax Vines - Muffin Greenhouse",
    description: "Trailing hoyas with waxy leaves and fragrant star flowers. Great for hanging baskets in Karachi homes. Shop online with delivery.",
  },
  orchids: {
    title: "Orchids for Sale - Muffin Greenhouse",
    description: "Exquisite phalaenopsis and dendrobium orchids for Karachi homes. Tropical elegance with care guidance included. Order online.",
  },
  "planting-media": {
    title: "Potting Soil & Planting Media - Muffin Greenhouse",
    description: "Premium coco coir, perlite, vermiculite, and custom soil mixes for indoor plants. Available for delivery across Karachi and Pakistan.",
  },
  fertilizer: {
    title: "Plant Fertilizers & Nutrients - Muffin Greenhouse",
    description: "Liquid feeds, slow-release pellets, and organic fertilizers for healthy plants. Shop online with delivery in Karachi and Pakistan.",
  },
  pots: {
    title: "Plant Pots & Planters - Muffin Greenhouse",
    description: "Ceramic, terracotta, and decorative pots in all sizes. Find the perfect planter for your plants. Delivery available in Karachi.",
  },
  "other-equipment": {
    title: "Plant Care Tools & Equipment - Muffin Greenhouse",
    description: "Misters, pruners, humidity trays, and everything plant parents need. Shop gardening tools online with Karachi delivery.",
  },
  all: {
    title: "All Plants & Supplies - Muffin Greenhouse",
    description: "Browse our full collection of locally grown indoor plants, pots, fertilizers, and tools. Home delivery available in Karachi and across Pakistan.",
  },
}

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const meta = categoryMetadata[params.category] || {
    title: `${params.category.charAt(0).toUpperCase() + params.category.slice(1).replace(/-/g, " ")} - Muffin Greenhouse`,
    description: "Browse our collection of quality plants for Karachi.",
  }
  return {
    title: meta.title,
    description: meta.description,
  }
}

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

  const categoryDisplayMeta = categoryMeta[params.category] || {
    title: params.category.charAt(0).toUpperCase() + params.category.slice(1).replace(/-/g, " "),
    description: "Browse our collection.",
    tagline: "Quality plants for Karachi.",
  }
  return (
    <ShopCategoryClient
      products={products}
      meta={categoryDisplayMeta}
      categorySlug={params.category}
      currentPage={requestedPage}
      totalPages={totalPages}
    />
  )
}
