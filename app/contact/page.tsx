import type { Metadata } from "next"
import { ContactPageClient } from "./contact-client"

export const metadata: Metadata = {
  title: "Contact Us - Muffin Greenhouse",
  description: "Get in touch with Muffin Greenhouse for plant advice, orders, or wholesale inquiries. WhatsApp, email, or visit us in Karachi.",
}

export default function ContactPage() {
  return <ContactPageClient />
}
