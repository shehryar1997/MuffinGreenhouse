import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductsByUseCase, useCases } from "@/lib/data/products"
import { ProductCard } from "@/components/ui/product-card"
import { UseCaseHeader } from "./use-case-header"

// ISR: revalidate every 5 minutes + on product updates via /api/revalidate
export const revalidate = 300

// SEO-optimized metadata for use case pages
const useCaseMetadata: Record<string, { title: string; description: string }> = {
  "low-light-survivors": {
    title: "Low-Light Indoor Plants - Muffin Greenhouse",
    description: "Snake plants, ZZ plants, and other shade-loving plants that thrive in dim Karachi apartments. Shop online with home delivery.",
  },
  "balcony-rooftop": {
    title: "Balcony & Rooftop Plants - Muffin Greenhouse",
    description: "Heat and wind-tolerant plants for Karachi balconies and rooftop gardens. Sun-loving succulents and hardy varieties available.",
  },
  "air-purifying": {
    title: "Air-Purifying Plants - Muffin Greenhouse",
    description: "NASA-recommended air-cleaning plants including Peace Lily, Snake Plant, and Pothos. Clean your Karachi home air naturally.",
  },
  "pet-safe": {
    title: "Pet-Safe Indoor Plants - Muffin Greenhouse",
    description: "Non-toxic plants safe for cats and dogs including spider plants, calatheas, and ferns. Pet-friendly greenery for Karachi homes.",
  },
  "beginner-proof": {
    title: "Easy Care Plants for Beginners - Muffin Greenhouse",
    description: "Hard-to-kill plants perfect for new plant parents in Karachi. Low maintenance options with included care guides. Shop online.",
  },
  "statement-plants": {
    title: "Large Statement Plants - Muffin Greenhouse",
    description: "Bold, dramatic plants that transform your space: Fiddle Leaf Figs, Monsteras, and Bird of Paradise. Delivery in Karachi.",
  },
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const meta = useCaseMetadata[params.slug] || {
    title: `${params.slug.charAt(0).toUpperCase() + params.slug.slice(1).replace(/-/g, " ")} Plants - Muffin Greenhouse`,
    description: "Shop plants curated for your needs. Delivery available in Karachi.",
  }
  return {
    title: meta.title,
    description: meta.description,
  }
}

interface ShopByNeedPageProps {
  params: { slug: string }
}

export default async function ShopByNeedPage({ params }: ShopByNeedPageProps) {
  const useCase = useCases[params.slug]
  const products = await getProductsByUseCase(params.slug)

  if (!useCase) return notFound()

  return (
    <div className="bg-cream-100 min-h-screen pt-28 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <UseCaseHeader icon={useCase.icon} title={useCase.title} desc={useCase.desc} count={products.length} />

        {products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-forest-500 text-lg">No plants in this category right now.</p>
            <p className="text-forest-400">Check back or browse all plants.</p>
          </div>
        )}
      </div>
    </div>
  )
}
