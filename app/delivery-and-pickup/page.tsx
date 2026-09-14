"use client"

import { motion } from "framer-motion"
import { Truck, Store, Clock, Package } from "lucide-react"

export default function DeliveryPickupPage() {
  return (
    <div className="bg-cream-100 min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-forest-500 mb-2">Shipping</p>
          <h1 className="font-serif text-display text-forest-900 mb-4">Delivery & Pickup</h1>
          <p className="text-forest-600">How we get plants to you safely.</p>
        </div>

        <div className="space-y-8">
          {/* Karachi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 border border-forest-200/50"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-sprout-300/20 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-sprout-300" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-forest-900">Karachi Delivery</h2>
                <p className="text-forest-500">Same-day for orders before 2pm</p>
              </div>
            </div>
            <ul className="space-y-2 text-forest-700">
              <li>PKR 200 flat rate across Karachi</li>
              <li>Plants secured in custom boxes with moisture retention</li>
              <li>Live tracking via WhatsApp</li>
            </ul>
          </motion.div>

          {/* Pickup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-cream-200 rounded-2xl p-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-clay-500/10 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-clay-500" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-forest-900">Free Pickup</h2>
                <p className="text-forest-500">DHA Phase 6, Karachi</p>
              </div>
            </div>
            <ul className="space-y-2 text-forest-700">
              <li>See plants before taking them home</li>
              <li>Personal care advice from our team</li>
              <li>Open daily 10am — 7pm</li>
            </ul>
          </motion.div>

          {/* Other Cities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 border border-forest-200/50"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-forest-200/50 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-forest-500" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-forest-900">Other Cities</h2>
                <p className="text-forest-500">2-3 day courier delivery</p>
              </div>
            </div>
            <p className="text-forest-700">
              We ship nationwide. Plants are packaged to survive the journey — 
              better than you'd think. Rates calculated at checkout.
            </p>
          </motion.div>

          {/* Guarantee */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-forest-300 text-cream-100 rounded-2xl p-8 text-center"
          >
            <Clock className="w-10 h-10 mx-auto mb-4 opacity-80" />
            <p className="text-lg">Arrives damaged? WhatsApp us within 6 hours with photos.<br/>We replace or refund — no arguments.</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
