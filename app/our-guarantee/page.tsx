import type { Metadata } from "next"
import { GuaranteeClient } from "./guarantee-client"

export const metadata: Metadata = {
  title: "Our 30-Day Plant Guarantee",
  description: "Shop with confidence. We guarantee healthy, acclimated plants. If your plant arrives damaged or dies within 30 days, we'll make it right.",
}

export default function GuaranteePage() {
  return <GuaranteeClient />
}
