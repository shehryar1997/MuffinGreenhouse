import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductBySlug } from "@/lib/data/products"
import { ProductDetailClient } from "./product-detail-client"

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  
  if (!product) {
    return { title: "Product Not Found" }
  }
  
  return {
    title: `${product.name}`,
    description: `${product.description} Buy ${product.name} online in Karachi. Healthy plants with care tips. Home delivery across Pakistan.`,
    alternates: { canonical: `/shop/product/${slug}` },
  }
}

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  return <ProductDetailClient product={product} />
}
