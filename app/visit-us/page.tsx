import type { Metadata } from "next"
import { VisitUsClient } from "./visit-us-client"

export const metadata: Metadata = {
  alternates: { canonical: "/visit-us" },
  title: "Pickup & Visits",
  description: "Collect your order or visit Muffin Greenhouse in Karachi. Pickups and visits are arranged on WhatsApp, and pickup is free.",
}

export default function VisitUsPage() {
  return <VisitUsClient />
}
