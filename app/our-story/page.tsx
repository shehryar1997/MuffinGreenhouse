import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import OurStoryPageClient from "./our-story-client"

export const metadata: Metadata = pageMetadata({ title: "Our Story", description: "How Muffin Plants started: plants sourced from around the world and propagated in Karachi, with honest care advice for Pakistani homes.", path: "/our-story" })

export default function OurStoryPage() {
  return <OurStoryPageClient />
}
