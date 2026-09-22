import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { FAQPageClient } from "./faq-client"

export const metadata: Metadata = pageMetadata({ title: "Frequently Asked Questions", description: "Answers to common questions about plant care, delivery, payment, returns and our 2-hour damage guarantee at Muffin Plants, Karachi.", path: "/faq" })

export default function FAQPage() {
  return <FAQPageClient />
}
