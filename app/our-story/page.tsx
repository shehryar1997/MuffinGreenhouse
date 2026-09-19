import type { Metadata } from "next"
import OurStoryPageClient from "./our-story-client"

export const metadata: Metadata = {
  title: "Our Story",
  description: "From humble beginnings to Karachi's trusted plant nursery. Learn how we grow healthy, acclimated plants for Pakistani homes.",
}

export default function OurStoryPage() {
  return <OurStoryPageClient />
}
