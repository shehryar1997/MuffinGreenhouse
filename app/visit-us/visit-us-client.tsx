'use client'

import { MapPin, Clock, Car, Coffee, Dog } from "lucide-react"
import Image from "next/image"

export function VisitUsClient() {
  return (
    <div className="bg-cream-100 min-h-screen">
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-5xl">
        <div className="text-center mb-16">
          <p className="font-mono text-sm text-forest-500 mb-2">Location</p>
          <h1 className="font-serif text-display text-forest-900 mb-4">Visit the Nursery</h1>
          <p className="text-forest-600 max-w-xl mx-auto">Browse plants in person, get advice from our team, and say hi to Bruno.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Info */}
          <div className="space-y-8">
            <div className="bg-cream-200 rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-sprout-300/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-sprout-300" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-forest-900 mb-1">Pickup Point</h2>
                  <p className="text-forest-600">Lane 5, Street 10, DHA Phase 6, Karachi</p>
                  <p className="text-forest-500 text-sm mt-2">The green gate is hard to miss</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-clay-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-clay-500" />
                </div>
                <div>
                  <h3 className="font-medium text-forest-900">Hours</h3>
                  <p className="text-forest-600">Daily 10am to 7pm</p>
                </div>
              </div>
            </div>

            <div className="bg-forest-300 text-cream-100 rounded-2xl p-8">
              <h3 className="font-serif text-xl mb-4">What to expect</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <span className="text-sprout-300">🌿</span>
                  <span>Browse plants in person before buying</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-sprout-300">💚</span>
                  <span>Personalized care advice from our team</span>
                </li>
                <li className="flex items-center gap-3">
                  <Dog className="w-5 h-5 text-sprout-300" />
                  <span>Say hi to Bruno, our friendly guard</span>
                </li>
                <li className="flex items-center gap-3">
                  <Coffee className="w-5 h-5 text-sprout-300" />
                  <span>Sometimes there&apos;s chai in the mornings</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80"
                alt="Nursery interior"
                fill
                className="object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1463320898484-cdee8141c787?w=600&q=80"
                  alt="Plant arrangement"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1503572327579-b5b3813743e5?w=600&q=80"
                  alt="Greenhouse"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-16 bg-white border border-forest-200/50 rounded-2xl p-8 text-center max-w-2xl mx-auto"
        >
          <Car className="w-10 h-10 text-clay-500 mx-auto mb-4" />
          <p className="text-forest-600">
            <strong>Free parking</strong> available on the lane. For all Karachi orders, 
            we offer free pickup or delivery starting at PKR 200.
          </p>
        </div>
      </div>
    </div>
  )
}