import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

// The checkout page is a client component, so its metadata lives here. It must never be indexed.
export const metadata: Metadata = pageMetadata({ title: "Checkout", description: "Review your order and choose delivery or pickup.", noindex: true })

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
