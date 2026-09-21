import type { Metadata } from "next"
import { MuffinPageClient } from "./muffin-client"

export const metadata: Metadata = {
  alternates: { canonical: "/muffin" },
  title: "Ask Muffin | Plant Assistant",
  description: "Ask Muffin, our plant assistant. Get quick plant care advice, identification help, and recommendations for your space.",
}

export default function MuffinPage() {
  return <MuffinPageClient />
}
