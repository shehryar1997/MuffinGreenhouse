"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { User, Heart, ShoppingBag, MapPin, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

// Placeholder account page - user not logged in variant
export default function AccountPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] pt-20">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-serif text-[clamp(2rem,6vw,4rem)] text-[#1A1A1A] leading-[0.95] tracking-tight mb-4">
            Your Account
          </h1>
          <p className="text-forest-600 text-lg mb-12 max-w-md">
            Sign in to view your orders, saved plants, and wishlist.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: User, label: "Profile", desc: "Manage your details" },
              { icon: ShoppingBag, label: "Orders", desc: "Track your plants" },
              { icon: Heart, label: "Wishlist", desc: "Saved for later" },
              { icon: MapPin, label: "Addresses", desc: "Delivery locations" },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 border border-forest-200/50 bg-white/50 opacity-50"
              >
                <item.icon className="w-6 h-6 text-forest-600 mb-4" />
                <h3 className="font-serif text-lg">{item.label}</h3>
                <p className="text-forest-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white">
              <Link href="/account/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/shop/all">Continue Shopping</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
