"use client"

import { motion } from "framer-motion"
import { Check, X, MessageCircle } from "lucide-react"

export default function GuaranteePage() {
  return (
    <div className="bg-cream-100 min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-forest-500 mb-2">Promise</p>
          <h1 className="font-serif text-display text-forest-900 mb-4">Our Guarantee</h1>
          <p className="text-forest-600">Because plants are living things, not products.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-sprout-300/20 border-2 border-sprout-300/30 rounded-2xl p-8 mb-8"
        >
          <h2 className="font-serif text-heading-2 text-forest-900 mb-4">6-Hour Health Check</h2>
          <p className="text-forest-700 leading-relaxed mb-6">
            We guarantee every plant arrives healthy and true to description. 
            If your plant arrives damaged or dying, send us a photo on WhatsApp within 6 hours of delivery. 
            We'll replace it free or refund you — your choice.
          </p>
          <a
            href="https://wa.me/923001234567"
            target="_blank"
            className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp for Claims
          </a>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-forest-200/50">
            <h3 className="font-serif text-lg text-forest-900 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-sprout-300" />
              We Cover
            </h3>
            <ul className="space-y-2 text-forest-700 text-sm">
              <li>• Broken stems from transit</li>
              <li>• Root rot at arrival</li>
              <li>• Major pest infestation</li>
              <li>• Wrong plant shipped</li>
              <li>• Dead/dying plant on arrival</li>
            </ul>
          </div>

          <div className="bg-cream-200 rounded-2xl p-6">
            <h3 className="font-serif text-lg text-forest-900 mb-4 flex items-center gap-2">
              <X className="w-5 h-5 text-clay-500" />
              We Don't Cover
            </h3>
            <ul className="space-y-2 text-forest-700 text-sm">
              <li>• Minor leaf damage (they recover)</li>
              <li>• Decline after 7+ days in your care</li>
              <li>• Plants we advised against for your light</li>
              <li>• User error (we help, just not with refunds)</li>
            </ul>
          </div>
        </div>

        <p className="text-center text-forest-500 mt-8">
          Real plants. Real people. Reasonable policies.
        </p>
      </div>
    </div>
  )
}
