import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { MuffinPageClient } from "./muffin-client"

export const metadata: Metadata = pageMetadata({ title: "Ask Muffin, Plant Assistant", description: "Ask Muffin, our plant assistant. Get quick plant care advice and recommendations for your space.", path: "/muffin" })

export default function MuffinPage() {
  return <MuffinPageClient />
}
