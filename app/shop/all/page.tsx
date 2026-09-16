import { getAllProducts } from "@/lib/data/products"
import { ShopAllClient } from "./shop-all-client"

export const revalidate = 300

export default async function ShopAllPage() {
  const products = await getAllProducts()
  return <ShopAllClient products={products} />
}

