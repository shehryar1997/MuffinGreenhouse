import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { ContactPageClient } from "./contact-client"

export const metadata: Metadata = pageMetadata({ title: "Contact Us", description: "Get in touch with Muffin Plants for plant advice, orders, or wholesale inquiries on WhatsApp or e-mail. Based in Karachi, delivering across Pakistan.", path: "/contact" })

export default function ContactPage() {
  return <ContactPageClient />
}
