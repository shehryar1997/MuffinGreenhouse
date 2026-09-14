"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ShoppingBag, Menu, X, User } from "lucide-react"
import { mainNav, mobileNav } from "@/config/nav.config"
import { useCart } from "@/components/providers/cart-provider"
import { Badge } from "@/components/ui/badge"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { toggleCart, itemCount } = useCart()

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20 border-b border-forest-200/50">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#1A1A1A] flex items-center justify-center">
              <span className="text-xs">&#10022;</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-xl text-[#1A1A1A]">Muffin</span>
              <span className="font-mono text-xs text-forest-500">/greenhouse</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {mainNav.slice(0, 4).map((item) => (
              <Link key={item.id} href={item.href} className="font-mono text-xs tracking-widest uppercase text-forest-600 hover:text-[#1A1A1A] transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <button className="p-2 hover:opacity-60 transition-opacity hidden sm:flex">
              <Search className="w-5 h-5 text-forest-700" />
            </button>
            <Link href="/account" className="p-2 hover:opacity-60 transition-opacity hidden sm:flex">
              <User className="w-5 h-5 text-forest-700" />
            </Link>

            {/* Menu Toggle */}
            <button
              className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-forest-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="hidden sm:inline">{mobileMenuOpen ? 'Close' : 'Menu'}</span>
              <span className="text-[#E85A3C] font-semibold sm:hidden">&#8594;</span>
              <span className="text-[#E85A3C] font-semibold hidden sm:inline">&#8594;</span>
            </button>

            {/* Cart */}
            <button onClick={() => toggleCart(true)} className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-widest uppercase text-forest-600 hidden sm:inline">Cart</span>
              <Badge className="bg-transparent border border-forest-300 text-forest-700 text-xs font-mono px-2 py-0.5">
                {itemCount}
              </Badge>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Overlay Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-20 bg-[#FAF7F2] z-40"
          >
            <div className="container mx-auto px-6 py-12">
              <nav className="space-y-8">
                {mainNav.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className="flex items-baseline gap-4 group"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="font-mono text-sm text-forest-400">{String(i + 1).padStart(2, '0')}</span>
                      <span className="font-serif text-4xl text-[#1A1A1A] group-hover:text-[#E85A3C] transition-colors">
                        {item.label}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-16 pt-8 border-t border-forest-200">
                <p className="font-mono text-xs text-forest-500 max-w-xs">
                  A different kind of plant shop. Curated in Karachi, built for real homes.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
