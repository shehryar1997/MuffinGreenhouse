import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { GuaranteeClient } from "./guarantee-client"

export const metadata: Metadata = pageMetadata({ title: "Our Plant Guarantee", description: "If your plant arrives dead or damaged, send us photos within 2 hours of receiving your package, return the plant, and choose a replacement or store credit.", path: "/our-guarantee" })

export default function GuaranteePage() {
  return <GuaranteeClient />
}
