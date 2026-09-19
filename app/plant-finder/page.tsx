import type { Metadata } from "next"
import { PlantFinderClient } from "./plant-finder-client"

export const metadata: Metadata = {
  title: "Plant Finder Quiz - Find Your Perfect Plant",
  description: "Take our 2-minute quiz to discover the perfect plants for your space, light conditions, and experience level in Karachi.",
}

export default function PlantFinderPage() {
  return <PlantFinderClient />
}
