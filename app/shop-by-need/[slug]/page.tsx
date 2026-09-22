import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { useCases } from "@/lib/data/products"
import { getProductsByUseCase } from "@/lib/data/catalog"
import { pageMetadata } from "@/lib/seo"
import { ProductCard } from "@/components/ui/product-card"
import { UseCaseHeader } from "./use-case-header"

// ISR: revalidate every 5 minutes + on product updates via /api/revalidate
export const revalidate = 300

export async function generateStaticParams() {
  return Object.keys(useCases).map((slug) => ({ slug }))
}

// Search listing for each "shop by need" page. Descriptions stay general: they must stay true whatever is in stock.
const useCaseMetadata: Record<string, { title: string; description: string }> = {
  "low-light-survivors": {
    title: "Low-Light Indoor Plants in Pakistan",
    description: "Plants that cope with dim rooms and north-facing windows, chosen for Karachi apartments. Delivered across Pakistan with care notes.",
  },
  "balcony-rooftop": {
    title: "Balcony & Rooftop Plants for Karachi",
    description: "Sun, heat and wind-tolerant plants for balconies and rooftop gardens in Karachi's climate. Delivered across Pakistan.",
  },
  "air-purifying": {
    title: "Air-Purifying Indoor Plants",
    description: "Leafy indoor plants often chosen to freshen up a room, with honest care notes for Pakistani homes. Delivered across Pakistan.",
  },
  "pet-safe": {
    title: "Pet-Safe Indoor Plants",
    description: "Plants that are not toxic to cats and dogs, for homes with pets. Every plant's pet safety is marked on its page.",
  },
  "beginner-proof": {
    title: "Easy Care Plants for Beginners",
    description: "Forgiving, low-maintenance plants for new plant parents, each with simple care notes. Delivered across Pakistan.",
  },
  "statement-plants": {
    title: "Large Statement Plants",
    description: "Big, bold plants that anchor a room or a terrace. Delivered with care in Karachi and across Pakistan.",
  },
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const meta = useCaseMetadata[slug]
  if (!meta || !useCases[slug]) return { title: "Not found", robots: { index: false, follow: true } }
  const products = await getProductsByUseCase(slug)
  // Keep the page out of search while nothing is tagged for it.
  return pageMetadata({ title: meta.title, description: meta.description, path: `/shop-by-need/${slug}`, noindex: products.length === 0 })
}

interface ShopByNeedPageProps {
  params: Promise<{ slug: string }>
}

export default async function ShopByNeedPage({ params }: ShopByNeedPageProps) {
  const { slug } = await params
  const useCase = useCases[slug]
  const products = await getProductsByUseCase(slug)

  if (!useCase) return notFound()

  return (
    <div className="bg-cream-100 min-h-screen pt-28 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <UseCaseHeader icon={useCase.icon} title={useCase.title} desc={useCase.desc} count={products.length} />

        {products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} sizes="(max-width: 1200px) 50vw, 33vw" />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-forest-500 text-lg">No plants in this category right now.</p>
            <p className="text-forest-500">Check back or browse all plants.</p>
          </div>
        )}
      </div>
    </div>
  )
}
