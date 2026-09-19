import type { Metadata } from "next"
import { VisitUsClient } from "./visit-us-client"

export const metadata: Metadata = {
  title: "Visit Our Nursery",
  description: "Plan your visit to Muffin Greenhouse in Karachi. See our plant collection in person, get expert advice, and take home your favorites.",
}

export default function VisitUsPage() {
  return <VisitUsClient />
}
