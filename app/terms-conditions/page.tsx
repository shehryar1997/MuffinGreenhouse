import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms of service for using Muffin Greenhouse website.",
}

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-[#F7F3EA]">
      <div className="container mx-auto px-6 lg:px-12 py-16 max-w-4xl">
        <section className="mb-12">
          <span className="font-mono text-xs tracking-widest uppercase text-[#1A1A1A]/50">Legal Notice</span>
          <h1 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mt-2">Terms & Conditions</h1>
          <p className="text-[#1A1A1A]/60 mt-4 text-sm">Last updated: January 2026</p>
        </section>
        <div className="bg-white rounded-sm p-8 border border-[#1A1A1A]/10">
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 mb-6">
            <p className="text-sm text-amber-800 font-medium">IMPORTANT LEGAL NOTICE</p>
            <p className="text-sm text-amber-700">This document is a first draft and requires review by a qualified Pakistani lawyer before launch.</p>
          </div>
          <div className="space-y-4 text-[#1A1A1A]/80">
            <p>Muffin Greenhouse operates muffinplants.com. By using our services, you agree to these Terms.</p>
            <h2 className="font-serif text-xl text-[#1A1A1A]">1. Eligibility</h2>
            <p>You must be 18+ and have capacity to contract under Pakistani law.</p>
            <h2 className="font-serif text-xl text-[#1A1A1A]">2. Payment</h2>
            <p>We accept HBL, JazzCash, EasyPaisa, NayaPay, SadaPay, Zindgi. Send receipt via WhatsApp. No card gateway.</p>
            <h2 className="font-serif text-xl text-[#1A1A1A]">3. Delivery</h2>
            <p>Karachi: Rs 400 flat for up to 4 items, Rs 1,000 for 5 or more. Self-pickup: Free. Out of city: Volumetric via Leopards Air.</p>
            <h2 className="font-serif text-xl text-[#1A1A1A]">4. Reviews</h2>
            <p>No fake reviews. All reviews are authentic customer feedback.</p>
            <h2 className="font-serif text-xl text-[#1A1A1A]">5. Law</h2>
            <p>Governed by Pakistani law. Karachi jurisdiction.</p>
            <h2 className="font-serif text-xl text-[#1A1A1A]">6. Contact</h2>
            <p>WhatsApp: +92 309 5360009 | Instagram: @muffinsgreenhouse</p>
          </div>
        </div>
      </div>
    </div>
  )
}
