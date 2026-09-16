import { notFound } from "next/navigation"
import { getProductBySlug } from "@/lib/data/products"
import { ProductDetailClient } from "./product-detail-client"

export const revalidate = 300

interface ProductDetailPageProps {
  params: { slug: string }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = await getProductBySlug(params.slug)

  if (!product) {
    notFound()
  }

  return <ProductDetailClient product={product} />
}
