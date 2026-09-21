import type { Metadata } from "next"
import { FAQPageClient } from "./faq-client"

export const metadata: Metadata = {
  alternates: { canonical: "/faq" },
  title: "Frequently Asked Questions",
  description: "Answers to common questions about plant care, delivery, returns, and our 2-hour damage guarantee. Muffin Greenhouse, Karachi.",
}

export default function FAQPage() {
  return <FAQPageClient />
}
