import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { DeliveryPickupClient } from "./delivery-pickup-client"

export const metadata: Metadata = pageMetadata({ title: "Delivery & Pickup Information", description: "Plant delivery across Karachi and the rest of Pakistan, carefully packed. Free pickup in Karachi, arranged on WhatsApp.", path: "/delivery-and-pickup" })

export default function DeliveryPickupPage() {
  return <DeliveryPickupClient />
}
