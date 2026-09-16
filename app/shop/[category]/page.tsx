import { getProductsByCategory, categoryMeta } from "@/lib/data/products"
import { ShopCategoryClient } from "./shop-category-client"

export const revalidate = 300

interface ShopCategoryPageProps {
  params: { category: string }
}

export default async function ShopCategoryPage({ params }: ShopCategoryPageProps) {
  const products = await getProductsByCategory(params.category)
  const meta = categoryMeta[params.category] || {
    title: params.category.charAt(0).toUpperCase() + params.category.slice(1).replace(/-/g, " "),
    description: "Browse our collection.",
    tagline: "Quality plants for Karachi.",
  }
  return <ShopCategoryClient products={products} meta={meta} categorySlug={params.category} />
}
