import type { Metadata } from "next"
import { DeliveryPickupClient } from "./delivery-pickup-client"

export const metadata: Metadata = {
  title: "Delivery & Pickup Information - Muffin Greenhouse",
  description: "Same-day and next-day plant delivery across Karachi. Free pickup available. We pack plants carefully for safe Pakistan-wide shipping.",
}

export default function DeliveryPickupPage() {
  return <DeliveryPickupClient />
}
