import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Muffin Greenhouse collects, uses, and protects your personal data.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-cream-100">
      <div className="container mx-auto px-6 lg:px-12 py-16 max-w-4xl">
        <section className="mb-12">
          <span className="font-mono text-xs tracking-widest uppercase text-forest-950/50">
            Legal Notice
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-forest-950 leading-[1.1] tracking-tight mt-2">
            Privacy Policy
          </h1>
          <p className="text-forest-950/60 mt-4 text-sm">
            Last updated: January 2026
          </p>
        </section>

        <div className="bg-surface rounded-sm p-8 lg:p-12 border border-forest-950/10">
          <div className="space-y-6 text-forest-950/80">
            
            <div className="bg-amber-50 border border-amber-200 rounded-sm p-4">
              <p className="text-sm text-amber-800 font-medium mb-1">
                IMPORTANT LEGAL NOTICE
              </p>
              <p className="text-sm text-amber-700">
                This document is a first draft and requires review and sign-off from a qualified Pakistani lawyer before launch. Consumer protection and data protection laws in Pakistan are evolving, particularly under PECA 2016 and provincial consumer protection ordinances.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">1. Introduction</h2>
              <p className="leading-relaxed">
                Muffin Greenhouse operates the website muffinplants.com. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase. By using our services, you consent to the practices described herein.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">2. Information We Collect</h2>
              <p className="leading-relaxed mb-2">We collect the following when you create an account or place an order:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Full name, email address, phone number</li>
                <li>Delivery address</li>
                <li>Order history and preferences</li>
                <li>Payment receipt images (sent via WhatsApp)</li>
              </ul>
              <p className="mt-3 text-sm">
                <strong>Important:</strong> We do not collect or store any payment card details or banking credentials. We only receive receipt images via WhatsApp for manual verification.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Processing and fulfilling orders</li>
                <li>Communicating about orders and deliveries</li>
                <li>Verifying payment receipts</li>
                <li>Arranging delivery with Leopards Courier</li>
                <li>Legal compliance and record-keeping</li>
              </ul>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">4. Data Storage and Security</h2>
              <p className="leading-relaxed">
                Your data is stored securely in our Supabase database. Payment receipt images are stored privately and are not publicly accessible. We implement appropriate measures to protect your data.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">5. Analytics</h2>
              <p className="leading-relaxed mb-2">
                We use <strong>Google Analytics 4</strong> to understand how visitors use our website. This helps us improve our services and user experience.
              </p>
              <p className="leading-relaxed mb-2">
                Google Analytics collects:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Pages visited and time spent on each page</li>
                <li>Your general location (city-level, approximate)</li>
                <li>Device and browser information</li>
                <li>Referring websites or search terms</li>
                <li>Purchase events (transaction amount, products ordered)</li>
              </ul>
              <p className="mt-3 text-sm">
                This data is processed by Google and is subject to Google&apos;s Privacy Policy. We do not share personal identifiers like names or emails with Google.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">6. Third-Party Disclosure</h2>
              <p className="leading-relaxed mb-2">We do not sell your data. Information is only shared with:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Leopards Courier:</strong> Name, phone, and address for shipping only.</li>
                <li><strong>Legal authorities:</strong> When required by law.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">7. Your Rights</h2>
              <p className="leading-relaxed">
                Under PECA 2016 and consumer protection principles, you may request access, correction, or deletion of your data. Contact us via WhatsApp at +92 309 5360009 or e-mail support@muffinplants.com.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">8. Cookies</h2>
              <p className="leading-relaxed">
                See our <Link href="/cookie-policy" className="underline hover:no-underline">Cookie Policy</Link>.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
