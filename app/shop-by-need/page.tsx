import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { ShopByNeedIndexClient } from "./shop-by-need-index-client"

export const metadata: Metadata = pageMetadata({ title: "Shop Plants by Need", description: "Find plants by what you need: low light, pet-safe, beginner-friendly, air-purifying and more. Chosen for Karachi homes.", path: "/shop-by-need" })

export default function ShopByNeedIndexPage() {
  return <ShopByNeedIndexClient />
}
