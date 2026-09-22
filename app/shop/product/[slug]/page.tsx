import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAddOnProducts, getProductBySlug } from "@/lib/data/catalog"
import { ProductDetailClient } from "./product-detail-client"
import { ProductReviews } from "@/components/shop/product-reviews"
import { getProductReviews } from "@/lib/reviews"
import { isPlantProduct } from "@/lib/product-categories"
import { pageMetadata, snippet } from "@/lib/seo"
import { socialImageUrl } from "@/lib/image-urls"
import { startingFromPrice, displayPrice } from "@/lib/product-photos"
import { formatPrice } from "@/lib/utils"

export const revalidate = 300

// No product is built ahead of time; each page is rendered on its first visit and then cached (ISR).
export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return { title: "Product Not Found", robots: { index: false, follow: true } }
  }

  // The admin panel's "Search listing" fields win; otherwise build a listing from the product itself.
  const from = startingFromPrice(product)
  const price = from !== null ? `from ${formatPrice(from)}` : formatPrice(displayPrice(product))
  const description =
    product.metaDescription ||
    snippet(`${product.shortDescription || product.description} ${product.name} ${price}, delivered across Pakistan.`)
  const social = socialImageUrl(product.images[0]?.url)

  return pageMetadata({
    title: product.metaTitle || `${product.name} Price in Pakistan`,
    description,
    path: `/shop/product/${slug}`,
    images: social ? [{ url: social, alt: product.images[0]?.alt || product.name }] : undefined,
  })
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

  const [{ reviews, average, count }, addOns] = await Promise.all([
    getProductReviews(product.id),
    // Plants get "complete the setup" suggestions: a pot, potting mix or fertilizer to go with them.
    isPlantProduct(product) ? getAddOnProducts([product.id], 3) : Promise.resolve([]),
  ])
  return (
    <ProductDetailClient
      product={product}
      addOns={addOns}
      rating={{ average, count }}
      reviewsSlot={<ProductReviews productId={product.id} productName={product.name} reviews={reviews} average={average} count={count} />}
    />
  )
}
