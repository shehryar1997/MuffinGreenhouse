import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { PlantFinderClient } from "./plant-finder-client"

export const metadata: Metadata = pageMetadata({ title: "Plant Finder Quiz: Find Your Perfect Plant", description: "Take our 2-minute quiz to find plants that suit your light, watering habits and home in Karachi.", path: "/plant-finder" })

export default function PlantFinderPage() {
  return <PlantFinderClient />
}
