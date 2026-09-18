import type { Metadata } from "next"
import { FAQPageClient } from "./faq-client"

export const metadata: Metadata = {
  title: "Frequently Asked Questions - Muffin Greenhouse",
  description: "Answers to common questions about plant care, delivery, returns, and our 30-day guarantee. Muffin Greenhouse, Karachi.",
}

export default function FAQPage() {
  return <FAQPageClient />
}
