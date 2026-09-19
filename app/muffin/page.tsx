import type { Metadata } from "next"
import { MuffinPageClient } from "./muffin-client"

export const metadata: Metadata = {
  title: "MUFFIN AI Plant Assistant",
  description: "Chat with MUFFIN, our AI plant expert. Get instant plant care advice, identification help, and recommendations for your space.",
}

export default function MuffinPage() {
  return <MuffinPageClient />
}
