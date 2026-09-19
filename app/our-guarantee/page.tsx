import type { Metadata } from "next"
import { GuaranteeClient } from "./guarantee-client"

export const metadata: Metadata = {
  title: "Our Plant Guarantee",
  description: "If your plant arrives dead or damaged, send us photos within 2 hours of receiving your package, return the plant, and choose a replacement or store credit.",
}

export default function GuaranteePage() {
  return <GuaranteeClient />
}
