import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { VisitUsClient } from "./visit-us-client"

export const metadata: Metadata = pageMetadata({ title: "Pickup & Visits", description: "Collect your order from Muffin Plants in Karachi. Pickups and visits are arranged on WhatsApp, and pickup is free.", path: "/visit-us" })

export default function VisitUsPage() {
  return <VisitUsClient />
}
