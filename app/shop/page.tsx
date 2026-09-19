import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Shop All Plants",
  description: "Browse our full collection of locally grown indoor plants, pots, fertilizers, and tools. Home delivery available in Karachi and across Pakistan.",
}

export default function ShopPage() {
  redirect("/shop/all")
}
