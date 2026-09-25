'use client'

import { Truck, Store, Clock, Package } from "lucide-react"

export function DeliveryPickupClient() {
  return (
    <div className="bg-cream-100 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-display text-forest-900 mb-4">Delivery & Pickup</h1>
          <p className="text-forest-600">White-glove service for your leafy companions, from our nursery to your home.</p>
        </div>

        <div className="space-y-8">
          {/* Karachi */}
          <div
            className="bg-surface rounded-2xl p-8 border border-forest-200/50"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-sprout-300/20 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-forest-700" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-forest-900">Karachi Delivery</h2>
                <p className="text-forest-500">Same-day for orders before 2 PM, because your plant babies shouldn&apos;t wait</p>
              </div>
            </div>
            <ul className="space-y-2 text-forest-700">
              <li>PKR 400 flat rate across Karachi for up to 4 items, PKR 1,000 for 5 or more</li>
              <li>Plants travel first-class: custom boxes, moisture retention, the works</li>
              <li>Live tracking via WhatsApp. Watch your green friend roll up in style</li>
            </ul>
          </div>

          {/* Pickup */}
          <div
            className="bg-cream-200 rounded-2xl p-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-clay-500/10 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-clay-500" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-forest-900">Self Pickup</h2>
                <p className="text-forest-500">Free, by arrangement in Karachi</p>
              </div>
            </div>
            <ul className="space-y-2 text-forest-700">
              <li>Choose Pickup at checkout, then message us on WhatsApp and we&apos;ll share the address</li>
              <li>Personal care advice from the Muffinman himself (yes, he&apos;s real)</li>
              <li>We agree a pickup time with you, so your plants are packed and waiting</li>
            </ul>
          </div>

          {/* Other Cities */}
          <div
            className="bg-surface rounded-2xl p-8 border border-forest-200/50"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-forest-200/50 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-forest-500" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-forest-900">Other Cities</h2>
                <p className="text-forest-500">2-3 day nationwide delivery</p>
              </div>
            </div>
            <ul className="space-y-2 text-forest-700">
              <li>Delivering from Karachi to all over Pakistan</li>
              <li>Partnered with Leopards Courier for reliable nationwide delivery</li>
              <li>Plants travel first-class in custom packaging with humidity packs</li>
              <li>2-3 day delivery to your doorstep</li>
              <li>Rates calculated at checkout based on your location</li>
              <li>Some tools and supplies ship from overseas: these take about 14 days after payment, and checkout shows the estimated date. If your order includes one, the whole order ships together</li>
            </ul>
          </div>

          {/* Guarantee */}
          <div
            className="bg-ink text-paper border border-paper/10 rounded-2xl p-8 text-center"
          >
            <Clock className="w-10 h-10 mx-auto mb-4 opacity-80" />
            <p className="text-lg">
              <strong>Plant Health Check:</strong> Share photos within 2 hours of receiving your package.<br/>
              Return a dead or damaged plant and choose a replacement or store credit.<br/>
              We package with care. You care for plants. We both win.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}