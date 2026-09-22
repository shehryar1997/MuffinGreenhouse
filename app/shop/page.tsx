import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { redirect } from "next/navigation"

export const metadata: Metadata = pageMetadata({ title: "Shop All Plants", description: "Browse indoor plants sourced worldwide and propagated in Karachi, plus pots, fertilizer and tools. Delivered across Pakistan.", path: "/shop/all" })

export default function ShopPage() {
  redirect("/shop/all")
}
