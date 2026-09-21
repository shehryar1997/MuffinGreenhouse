import type { Metadata } from "next"

export const metadata: Metadata = {
  alternates: { canonical: "/cookie-policy" },
  title: "Cookie Policy",
  description: "Information about cookies used on Muffin Greenhouse.",
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-cream-100">
      <div className="container mx-auto px-6 lg:px-12 py-16 max-w-4xl">

        <section className="mb-12">
          <span className="font-mono text-xs tracking-widest uppercase text-forest-950/50">
            Legal Notice
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-forest-950 leading-[1.1] tracking-tight mt-2">
            Cookie Policy
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
                This document is a first draft and requires review by a qualified Pakistani lawyer before launch.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">1. What Are Cookies?</h2>
              <p className="leading-relaxed">
                Cookies are small text files placed on your device when you visit a website. They help remember preferences and improve your experience. Similar technologies include local storage and session storage.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">2. Cookies We Use</h2>

              <h3 className="font-serif text-lg text-forest-950 mt-4 mb-2">Essential Cookies (Required)</h3>
              <p className="leading-relaxed mb-2">Necessary for the website to function:</p>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li>Shopping cart functionality</li>
                <li>Session management</li>
                <li>Security features</li>
              </ul>
              <p className="text-sm">These cannot be disabled as they are essential for service.</p>

              <h3 className="font-serif text-lg text-forest-950 mt-4 mb-2">Functional Cookies</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Preferred language or region</li>
                <li>Wishlist items</li>
                <li>Display preferences</li>
              </ul>

              <h3 className="font-serif text-lg text-forest-950 mt-4 mb-2">Analytics Cookies</h3>
              <p className="leading-relaxed mb-2">
                We use <strong>Google Analytics 4</strong> to collect anonymous usage data. These cookies track:
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-2">
                <li>Pages you visit and time spent</li>
                <li>General geographic location (city-level)</li>
                <li>Device and browser type</li>
                <li>Referral source (where you came from)</li>
                <li>Purchase events (anonymized)</li>
              </ul>
              <p className="text-sm mb-1">
                <strong>Cookie names:</strong> _ga, _ga_*, _gid, _gat
              </p>
              <p className="text-sm">
                <strong>Lifetime:</strong> _ga (2 years), _gid (24 hours), _gat (1 minute)
              </p>

              <h3 className="font-serif text-lg text-forest-950 mt-4 mb-2">Marketing Cookies</h3>
              <p className="text-sm">
                <strong>Currently not used:</strong> We do not use cookies for advertising or remarketing.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">3. Local Storage</h2>
              <p className="leading-relaxed mb-2">We use browser storage:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>LocalStorage:</strong> Stores cart and wishlist locally on your device</li>
                <li><strong>SessionStorage:</strong> Temporary session data</li>
              </ul>
              <p className="mt-3 text-sm">These do not transmit data to our servers.</p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">4. Third-Party Cookies</h2>
              <p className="leading-relaxed mb-2">
                We use <strong>Google Analytics</strong> (Google Inc.), which sets third-party cookies to collect anonymous usage statistics. Google processes this data and is subject to their Privacy Policy.
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-2">
                <li><strong>Google Analytics:</strong> For website usage analytics</li>
                <li><strong>Google&apos;s Privacy Policy:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">policies.google.com/privacy</a></li>
              </ul>
              <p className="text-sm">
                We do not embed content from YouTube, social media plugins, or advertising networks.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">5. Managing Cookies</h2>
              <p className="leading-relaxed mb-2">Manage cookies through browser settings:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Chrome: Settings &gt; Privacy and security &gt; Cookies</li>
                <li>Safari: Preferences &gt; Privacy &gt; Cookies</li>
                <li>Firefox: Settings &gt; Privacy &gt; Cookies</li>
              </ul>
              <p className="mt-3 text-sm">Disabling essential cookies may prevent placing orders.</p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">6. Cookie Duration</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Session:</strong> Deleted when browser closes</li>
                <li><strong>Cart:</strong> Until you clear it, or sign out of your account</li>
                <li><strong>Auth:</strong> Duration of login session</li>
              </ul>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-forest-950 mb-3">7. Contact</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>WhatsApp: +92 309 5360009</li>
                <li>E-mail: support@muffinplants.com</li>
                <li>Instagram: @muffinsgreenhouse</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
