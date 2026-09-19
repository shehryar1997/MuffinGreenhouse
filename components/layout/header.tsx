"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ShoppingBag, Menu, X, User, Star, Sparkles } from "lucide-react"
import { mainNav, shopMegaMenuSections } from "@/config/nav.config"
import { useCart } from "@/components/providers/cart-provider"
import { useSearch } from "@/components/providers/search-provider"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shopMenuOpen, setShopMenuOpen] = useState(false)
  const shopMenuTimeout = useRef<NodeJS.Timeout | null>(null)
  const { toggleCart, itemCount } = useCart()
  const { openSearch } = useSearch()

  const handleShopMenuEnter = () => {
    if (shopMenuTimeout.current) {
      clearTimeout(shopMenuTimeout.current)
      shopMenuTimeout.current = null
    }
    setShopMenuOpen(true)
  }

  const handleShopMenuLeave = () => {
    shopMenuTimeout.current = setTimeout(() => {
      setShopMenuOpen(false)
    }, 150)
  }

  return (
    <>
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20 border-b border-border">
          {/* Logo */}
          <Link href="/" className="flex flex-col items-center gap-0.5">
            <Image
              src="/logo-nav.png"
              alt="Muffin Plants"
              width={37}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
            <span className="font-serif text-sm text-foreground leading-none">Muffin Plants</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {mainNav.map((item) => (
              item.hasMegaMenu ? (
                <div 
                  key={item.id} 
                  className="relative inline-flex items-center"
                  onMouseEnter={handleShopMenuEnter}
                  onMouseLeave={handleShopMenuLeave}
                >
                  <Link 
                    href={item.href} 
                    className="font-mono text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors py-2 inline-block"
                  >
                    {item.label}
                  </Link>
                  
                  {/* Shop Mega Menu */}
                  <AnimatePresence>
                    {shopMenuOpen && (
                      <>
                        {/* Backdrop overlay */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="fixed inset-0 top-20 bg-black/10 z-40"
                          onClick={() => setShopMenuOpen(false)}
                        />
                        
                        {/* Mega menu - centered on screen */}
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25 }}
                          className="fixed inset-x-0 top-20 z-50"
                        >
                          <div 
                            className="bg-background border border-border shadow-2xl rounded-lg overflow-hidden"
                            onMouseEnter={handleShopMenuEnter}
                            onMouseLeave={handleShopMenuLeave}
                          >
                            <div className="px-10 py-10">
                              <div className="grid grid-cols-3 gap-12">
                                {shopMegaMenuSections.map((section) => (
                                  <div key={section.id} className="space-y-5">
                                    <div className="flex items-center gap-2 border-b border-forest-200/50 pb-3">
                                      <h3 className="font-serif text-lg text-foreground">
                                        {section.title}
                                      </h3>
                                    </div>
                                    <ul className="space-y-1">
                                      {section.items.map((item) => (
                                        <li key={item.id}>
                                          <Link
                                            href={item.href}
                                            className="group flex items-center justify-between py-2 px-2 -mx-2 rounded-md font-mono text-sm text-forest-600 hover:text-[#1A1A1A] hover:bg-forest-100/50 transition-all"
                                            onClick={() => setShopMenuOpen(false)}
                                          >
                                            <span className="flex items-center gap-2">
                                              <span className="relative">
                                                {item.label}
                                                {item.featured && (
                                                  <span className="ml-1.5 inline-flex items-center">
                                                    <Star className="w-2.5 h-2.5 fill-[#E85A3C] text-[#E85A3C]" />
                                                  </span>
                                                )}
                                              </span>
                                            </span>
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-forest-400">→</span>
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="bg-forest-50 px-8 py-4 border-t border-forest-200/30">
                              <Link 
                                href="/shop/all" 
                                className="flex items-center justify-center gap-2 font-mono text-xs tracking-widest uppercase text-forest-700 hover:text-[#E85A3C] transition-colors"
                                onClick={() => setShopMenuOpen(false)}
                              >
                                <span>View All Products</span>
                                <span>→</span>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : item.isAi ? (
                <Link 
                  key={item.id}
                  href={item.href} 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-forest-300 bg-forest-50/50 hover:bg-forest-100 hover:border-forest-400 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-forest-600" />
                  <span className="font-mono text-xs font-bold tracking-widest uppercase text-forest-700">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <Link 
                  key={item.id}
                  href={item.href} 
                  className="font-mono text-xs tracking-widest uppercase text-forest-600 hover:text-[#1A1A1A] transition-colors"
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <button onClick={openSearch} className="p-2 hover:opacity-60 transition-opacity hidden sm:flex">
              <Search className="w-5 h-5 text-forest-700" />
            </button>
            <Link href="/account" className="p-2 hover:opacity-60 transition-opacity hidden sm:flex">
              <User className="w-5 h-5 text-forest-700" />
            </Link>

            {/* Menu Toggle */}
            <button
              className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-forest-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              <span className="hidden sm:inline">{mobileMenuOpen ? 'Close' : 'Menu'}</span>
              <span className="text-[#E85A3C] font-semibold sm:hidden" aria-hidden="true">&#8594;</span>
              <span className="text-[#E85A3C] font-semibold hidden sm:inline" aria-hidden="true">&#8594;</span>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

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

    </motion.header>

    {/* Mobile/Overlay Menu - Rendered outside header for proper z-index stacking */}
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100]"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Slide-in menu panel */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#FAF7F2] z-[100] shadow-2xl"
          >
            <div className="h-full overflow-y-auto px-6 py-12 pt-24">
              <nav className="space-y-8">
                {mainNav.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className="flex items-baseline gap-4 group"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="font-mono text-sm text-forest-400">{String(i + 1).padStart(2, '0')}</span>
                      {item.isAi ? (
                        <span className="flex items-center gap-2">
                          <span className="font-serif text-4xl text-[#1A1A1A] group-hover:text-[#E85A3C] transition-colors">
                            {item.label}
                          </span>
                          <Sparkles className="w-5 h-5 text-forest-500" />
                        </span>
                      ) : (
                        <span className="font-serif text-4xl text-[#1A1A1A] group-hover:text-[#E85A3C] transition-colors">
                          {item.label}
                        </span>
                      )}
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
        </>
      )}
    </AnimatePresence>
  </>
  )
}
