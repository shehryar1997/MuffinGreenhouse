import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund, return, and cancellation policies for plant orders.",
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-cream-100">
      <div className="container mx-auto px-6 lg:px-12 py-16 max-w-4xl">
        <section className="mb-12">
          <span className="font-mono text-xs tracking-widest uppercase text-forest-950/50">Legal Notice</span>
          <h1 className="font-serif text-4xl md:text-5xl text-forest-950 mt-2">Refund Policy</h1>
          <p className="text-forest-950/60 mt-4 text-sm">Last updated: September 2026</p>
        </section>
        <div className="bg-surface rounded-sm p-8 border border-forest-950/10">
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 mb-6">
            <p className="text-sm text-amber-800 font-medium">IMPORTANT LEGAL NOTICE</p>
            <p className="text-sm text-amber-700">This document is a first draft and requires review by a qualified Pakistani lawyer before launch.</p>
          </div>
          <div className="space-y-6 text-forest-950/80">
            <div className="bg-sprout-300/20 border border-sprout-300 rounded-sm p-4">
              <p className="font-serif text-forest-950">No Hidden Fees Policy</p>
              <p className="text-sm">All costs disclosed upfront. No hidden charges.</p>
            </div>
            <p>Plants are living, perishable products. This policy outlines your rights.</p>
            <h2 className="font-serif text-xl text-forest-950">1. Damaged Plants</h2>
            <p>Report damage within 2 hours of receiving your package, with clear photos of the plant and its packaging, on WhatsApp. The short window is because plants are perishable and transit damage shows quickly. Once we approve the claim, you return the plant to us and choose a replacement or store credit.</p>
            <h2 className="font-serif text-xl text-forest-950">2. Not Covered</h2>
            <p>Claims made more than 2 hours after you received the package, plants that are not returned to us, decline caused by improper care or an unsuitable spot, minor cosmetic damage, or change of mind.</p>
            <h2 className="font-serif text-xl text-forest-950">3. How a Claim Works</h2>
            <p>Send your order number and photos to us on WhatsApp (+92 309 5360009) within the 2-hour window. We&apos;ll confirm the claim and tell you how to send the plant back. We settle approved claims with a replacement or store credit; we don&apos;t offer cash refunds for plants.</p>
            <h2 className="font-serif text-xl text-forest-950">Unpaid Orders</h2>
            <p>An order that isn&apos;t paid within 24 hours is cancelled automatically and its plants go back on sale. You&apos;re welcome to place it again any time.</p>
            <h2 className="font-serif text-xl text-forest-950">4. Guarantee</h2>
            <p>See our <Link href="/our-guarantee" className="underline">Our Guarantee</Link> page.</p>
            <h2 className="font-serif text-xl text-forest-950">5. Contact</h2>
            <p>WhatsApp: +92 309 5360009 | E-mail: support@muffinplants.com | Instagram: @muffinsgreenhouse</p>
          </div>
        </div>
      </div>
    </div>
  )
}
