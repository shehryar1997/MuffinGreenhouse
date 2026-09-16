import { notFound } from "next/navigation"
import { getProductsByUseCase, useCases } from "@/lib/data/products"
import { ProductCard } from "@/components/ui/product-card"
import { UseCaseHeader } from "./use-case-header"

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
