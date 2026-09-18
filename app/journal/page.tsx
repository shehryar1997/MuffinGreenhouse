import type { Metadata } from "next"
import { getAllJournalPosts } from "@/lib/data/journal"
import { JournalPageClient } from "./journal-client"

export const metadata: Metadata = {
  title: "Plant Care Journal & Tips - Muffin Greenhouse",
  description: "Expert plant care guides, indoor gardening tips, and plant parent advice tailored for Karachi and Pakistani climates.",
}

export default function JournalPage() {
  return <JournalPageClient />
}
