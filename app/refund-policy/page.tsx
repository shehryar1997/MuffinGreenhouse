import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund, return, and cancellation policies for plant orders.",
}

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F7F3EA]" id="main-content">
      <div className="container mx-auto px-6 lg:px-12 py-16 max-w-4xl">
        <section className="mb-12">
          <span className="font-mono text-xs tracking-widest uppercase text-[#1A1A1A]/50">Legal Notice</span>
          <h1 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mt-2">Refund Policy</h1>
          <p className="text-[#1A1A1A]/60 mt-4 text-sm">Last updated: January 2026</p>
        </section>
        <div className="bg-white rounded-sm p-8 border border-[#1A1A1A]/10">
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 mb-6">
            <p className="text-sm text-amber-800 font-medium">IMPORTANT LEGAL NOTICE</p>
            <p className="text-sm text-amber-700">This document is a first draft and requires review by a qualified Pakistani lawyer before launch.</p>
          </div>
          <div className="space-y-6 text-[#1A1A1A]/80">
            <div className="bg-[#D4F542]/20 border border-[#D4F542] rounded-sm p-4">
              <p className="font-serif text-[#1A1A1A]">No Hidden Fees Policy</p>
              <p className="text-sm">All costs disclosed upfront. No hidden charges.</p>
            </div>
            <p>Plants are living, perishable products. This policy outlines your rights.</p>
            <h2 className="font-serif text-xl text-[#1A1A1A]">1. Damaged Plants</h2>
            <p>Report damage within 2 hours of delivery with photo evidence via WhatsApp. The 2-hour window is standard for plant e-commerce due to perishable nature. Approved claims: refund or replacement.</p>
            <h2 className="font-serif text-xl text-[#1A1A1A]">2. Not Covered</h2>
            <p>Plants dying after 2 days due to improper care, mishandling, cosmetic damage, or change of mind.</p>
            <h2 className="font-serif text-xl text-[#1A1A1A]">3. Refund Process</h2>
            <p>WhatsApp +92 309 5360009 with order number and photos. Bank refunds: 5-7 days. Wallet refunds: 2-3 days.</p>
            <h2 className="font-serif text-xl text-[#1A1A1A]">4. Guarantee</h2>
            <p>See our <Link href="/our-guarantee" className="underline">Our Guarantee</Link> page.</p>
            <h2 className="font-serif text-xl text-[#1A1A1A]">5. Contact</h2>
            <p>WhatsApp: +92 309 5360009 | Instagram: @muffinsgreenhouse</p>
          </div>
        </div>
      </div>
    </main>
  )
}
