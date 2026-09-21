import type { Metadata } from "next"
import { DeliveryPickupClient } from "./delivery-pickup-client"

export const metadata: Metadata = {
  alternates: { canonical: "/delivery-and-pickup" },
  title: "Delivery & Pickup Information",
  description: "Same-day and next-day plant delivery across Karachi. Free pickup available, arranged on WhatsApp. We pack plants carefully for safe Pakistan-wide shipping.",
}

export default function DeliveryPickupPage() {
  return <DeliveryPickupClient />
}
