import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({ title: "Terms & Conditions", description: "Terms of service for shopping at muffinplants.com.", path: "/terms-conditions" })

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-cream-100">
      <div className="container mx-auto px-6 lg:px-12 py-16 max-w-4xl">
        <section className="mb-12">
          <span className="font-mono text-xs tracking-widest uppercase text-forest-950/50">Legal Notice</span>
          <h1 className="font-serif text-4xl md:text-5xl text-forest-950 mt-2">Terms & Conditions</h1>
          <p className="text-forest-950/60 mt-4 text-sm">Last updated: September 2026</p>
        </section>
        <div className="bg-surface rounded-sm p-8 border border-forest-950/10">
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 mb-6">
            <p className="text-sm text-amber-800 font-medium">IMPORTANT LEGAL NOTICE</p>
            <p className="text-sm text-amber-700">This document is a first draft and requires review by a qualified Pakistani lawyer before launch.</p>
          </div>
          <div className="space-y-4 text-forest-950/80">
            <p>Muffin Plants operates muffinplants.com. By using our services, you agree to these Terms.</p>
            <h2 className="font-serif text-xl text-forest-950">1. Eligibility</h2>
            <p>You must be 18+ and have capacity to contract under Pakistani law.</p>
            <h2 className="font-serif text-xl text-forest-950">2. Payment</h2>
            <p>We accept bank transfer (HBL), JazzCash and Easypaisa. Send your receipt via WhatsApp. Unpaid orders are held for 24 hours, then cancelled. No card gateway.</p>
            <h2 className="font-serif text-xl text-forest-950">3. Delivery</h2>
            <p>Karachi: Rs 400 flat for up to 4 items, Rs 1,000 for 5 or more. Self-pickup: Free. Out of city: Volumetric via Leopards Air.</p>
            <h2 className="font-serif text-xl text-forest-950">4. Plant Packaging</h2>
            <p>Aroids, Hoyas and Orchids are always shipped potted, in their original pot.</p>
            <p>
              Sansevierias, Agaves, hard-leaf Mangaves and Cacti &amp; Succulents have leaves that can snap or break if
              packed inside their pot for transit. These are shipped bare-root, with the pot sent separately in the
              same box. They are tough, hardy plants and are not stressed by bare-root shipping. Simply pot the plant
              in fresh planting media using the pot provided (or your own) once it arrives.
            </p>
            <h2 className="font-serif text-xl text-forest-950">5. Plant Variety &amp; Appearance</h2>
            <p>
              Plants are living things. The variety and quality you receive will be the same as shown on the product
              page, but the exact plant can differ a little from the photo in leaf pattern, size, shape and colour.
            </p>
            <h2 className="font-serif text-xl text-forest-950">6. Other Equipment: Delays &amp; Damage</h2>
            <p>
              For products in the Other Equipment category: if your order arrives later than the delivery date we
              committed to, you receive Rs 200 store credit for the delay.
            </p>
            <p>
              If the item you receive is damaged, you can return it. We will ship a replacement free of cost (we cover
              the shipping charges), or, if you prefer, give you store credit instead. The choice is yours.
            </p>
            <h2 className="font-serif text-xl text-forest-950">7. Reviews</h2>
            <p>No fake reviews. All reviews are authentic customer feedback.</p>
            <h2 className="font-serif text-xl text-forest-950">8. Law</h2>
            <p>Governed by Pakistani law. Karachi jurisdiction.</p>
            <h2 className="font-serif text-xl text-forest-950">9. Contact</h2>
            <p>WhatsApp: +92 309 5360009 | E-mail: support@muffinplants.com | Instagram: @muffinsgreenhouse</p>
          </div>
        </div>
      </div>
    </div>
  )
}
