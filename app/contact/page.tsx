"use client"

import { motion } from "framer-motion"
import { MessageCircle, Mail, MapPin } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="bg-cream-100 min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-forest-500 mb-2">Get in Touch</p>
          <h1 className="font-serif text-display text-forest-900 mb-4">Contact Us</h1>
          <p className="text-forest-600">Questions? We're here to help.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.a
            href="https://wa.me/923001234567"
            target="_blank"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500 text-white rounded-2xl p-8 hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-10 h-10 mb-4" />
            <h2 className="font-serif text-xl mb-2">WhatsApp</h2>
            <p className="opacity-80 text-sm">Fastest way to reach us</p>
            <p className="font-mono mt-4">+92 300 1234567</p>
          </motion.a>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-cream-200 rounded-2xl p-8"
          >
            <Mail className="w-10 h-10 text-clay-500 mb-4" />
            <h2 className="font-serif text-xl text-forest-900 mb-2">Email</h2>
            <p className="text-forest-600 text-sm mb-4">For detailed questions</p>
            <a href="mailto:hello@muffin.pk" className="font-mono text-clay-500 hover:underline">
              hello@muffin.pk
            </a>
          </motion.div>
        </div>

        <div className="mt-8 bg-forest-300 text-cream-100 rounded-2xl p-8">
          <MapPin className="w-8 h-8 mb-4 opacity-80" />
          <h3 className="font-serif text-xl mb-2">Visit the Nursery</h3>
          <p>Lane 5, Street 10, DHA Phase 6, Karachi</p>
          <p className="opacity-80 mt-2">Open daily 10am — 7pm</p>
        </div>
      </div>
    </div>
  )
}
