import type { Metadata } from "next"
import { ShopByNeedIndexClient } from "./shop-by-need-index-client"

export const metadata: Metadata = {
  alternates: { canonical: "/shop-by-need" },
  title: "Shop Plants by Need",
  description: "Find plants by your specific needs: low-light, pet-safe, beginner-friendly, air-purifying, and more. Curated for Karachi homes.",
}

export default function ShopByNeedIndexPage() {
  return <ShopByNeedIndexClient />
}
