"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Heart, Search, ShoppingBag, Menu, User, Star, X } from "lucide-react"
import { askMuffin, mainNav, shopMegaMenuSections } from "@/config/nav.config"
import { useCart } from "@/components/providers/cart-provider"
import { useSearch } from "@/components/providers/search-provider"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { MobileTabBar } from "@/components/layout/mobile-tab-bar"

// Pages reachable from the phone menu that are not in the main nav (which only has the top-level sections).
const moreLinks = [
  { href: "/plant-finder", label: "Plant finder" },
  { href: "/shop-by-need", label: "Shop by need" },
  { href: "/our-story", label: "Our story" },
  { href: "/visit-us", label: "Visit us" },
  { href: "/reviews", label: "Reviews" },
  { href: "/delivery-and-pickup", label: "Delivery & pickup" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shopMenuOpen, setShopMenuOpen] = useState(false)
  const [menuShopOpen, setMenuShopOpen] = useState(false)
  const shopMenuTimeout = useRef<NodeJS.Timeout | null>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const { toggleCart, itemCount } = useCart()
  const { openSearch } = useSearch()
  const { count: wishlistCount } = useWishlist()

  // The phone menu can open with the Shop section already expanded (the "Shop" tab in the bottom bar).
  const openMobileMenu = (expandShop = false) => {
    setMenuShopOpen(expandShop)
    setMobileMenuOpen(true)
  }

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

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [mobileMenuOpen])

  // Focus trap and initial focus. The focusable set is read on every Tab because expanding "Shop" changes it.
  useEffect(() => {
    if (!mobileMenuOpen) return

    const focusable = () =>
      Array.from(mobileMenuRef.current?.querySelectorAll<HTMLElement>('a[href], button, [tabindex]:not([tabindex="-1"])') ?? [])

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      const elements = focusable()
      if (!elements.length) return
      const first = elements[0]
      const last = elements[elements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus()
          e.preventDefault()
        }
      } else if (document.activeElement === last) {
        first.focus()
        e.preventDefault()
      }
    }

    document.addEventListener("keydown", handleTabKey)
    mobileMenuRef.current?.querySelector<HTMLElement>("[data-menu-close]")?.focus()
    const menuButton = menuButtonRef.current

    return () => {
      document.removeEventListener("keydown", handleTabKey)
      // Hand focus back to the hamburger so keyboard users land where they started.
      menuButton?.focus()
    }
  }, [mobileMenuOpen])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileMenuOpen])

  return (
    <>
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20 border-b border-border">
          
          {/* LEFT: Logo (desktop) / Hamburger (mobile) */}
          <div className="flex items-center gap-2 lg:gap-4 flex-1 lg:flex-none">
            {/* Hamburger Menu Button - Mobile Only */}
            <button 
              ref={menuButtonRef}
              onClick={() => openMobileMenu()}
              className="lg:hidden p-3 -ml-2 hover:bg-muted rounded-full transition-colors touch-target"
              style={{ touchAction: "manipulation" }}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              <Menu className="w-6 h-6 text-foreground" aria-hidden="true" />
            </button>

            {/* Logo - Desktop Only (Left Side) */}
            <Link 
              href="/" 
              className="hidden lg:flex flex-col items-center gap-0.5 p-2 -m-2"
              aria-label="Muffin Plants - Home"
            >
              <Image
                src="/logo-nav.png"
                alt=""
                width={37}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
              <span className="font-serif text-xs text-foreground leading-none">Muffin Plants</span>
            </Link>
          </div>

          {/* CENTER: Logo (mobile only) */}
          <div className="flex-1 lg:flex-none flex justify-center lg:hidden">
            <Link 
              href="/" 
              className="flex flex-col items-center gap-0.5 p-2 -m-2"
              aria-label="Muffin Plants - Home"
            >
              <Image
                src="/logo-nav.png"
                alt=""
                width={37}
                height={40}
                className="h-9 w-auto  object-contain"
                priority
              />
              <span className="font-serif text-xs text-foreground leading-none hidden sm:block">Muffin Plants</span>
            </Link>
          </div>

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
                                    <div className="flex items-center gap-2 border-b border-border pb-3">
                                      <h3 className="font-serif text-lg text-foreground">
                                        {section.href ? (
                                          <Link
                                            href={section.href}
                                            className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                                            onClick={() => setShopMenuOpen(false)}
                                          >
                                            {section.title}
                                          </Link>
                                        ) : (
                                          section.title
                                        )}
                                      </h3>
                                    </div>
                                    <ul className="space-y-1">
                                      {section.items.map((item) => (
                                        <li key={item.id}>
                                          <Link
                                            href={item.href}
                                            className="group flex items-center justify-between py-2 px-2 -mx-2 rounded-md font-mono text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            onClick={() => setShopMenuOpen(false)}
                                          >
                                            <span className="flex items-center gap-2">
                                              <span className="relative">
                                                {item.label}
                                                {item.featured && (
                                                  <span className="ml-1.5 inline-flex items-center">
                                                    <Star className="w-2.5 h-2.5 fill-primary text-primary" aria-hidden="true" />
                                                  </span>
                                                )}
                                              </span>
                                            </span>
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" aria-hidden="true">→</span>
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="bg-muted px-8 py-4 border-t border-border">
                              <Link 
                                href="/shop/all" 
                                className="flex items-center justify-center gap-2 font-mono text-xs tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors touch-target-sm"
                                onClick={() => setShopMenuOpen(false)}
                              >
                                <span>View All Products</span>
                                <span aria-hidden="true">→</span>
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
                  className="group flex flex-col items-center gap-0.5 p-2 -m-2"
                  aria-label={`${item.label}, our plant assistant`}
                >
                  <Image
                    src={askMuffin.logo}
                    alt=""
                    width={askMuffin.logoWidth}
                    height={askMuffin.logoHeight}
                    className="h-9 w-auto object-contain transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 dark:rounded-lg dark:bg-paper dark:px-1"
                  />
                  <span className="font-serif text-xs text-foreground leading-none">{item.label}</span>
                </Link>
              ) : (
                <Link 
                  key={item.id}
                  href={item.href} 
                  className="font-mono text-xs tracking-widest uppercase text-forest-600 hover:text-forest-950 transition-colors"
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* RIGHT: Actions (Account on mobile; search, wishlist and cart live in the bottom tab bar) */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-1 lg:flex-none justify-end">
            
            {/* Desktop: Account */}
            <Link 
              href="/account" 
              className="hidden lg:inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"
              aria-label="My Account"
            >
              <User className="w-5 h-5" />
              <span className="hidden 2xl:inline">Account</span>
            </Link>

            {/* Desktop: Wishlist */}
            <Link
              href="/wishlist"
              className="hidden lg:flex p-2 hover:bg-muted rounded-full transition-colors relative"
              aria-label={`Wishlist with ${wishlistCount} saved plants`}
            >
              <Heart className="w-5 h-5 text-foreground" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-0.5 bg-clay-500 text-white text-xs font-mono font-semibold rounded-full flex items-center justify-center">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Desktop: Search */}
            <button 
              onClick={openSearch} 
              className="hidden lg:flex p-2 hover:bg-muted rounded-full transition-colors"
              aria-label="Search products"
            >
              <Search className="w-5 h-5 text-foreground" />
            </button>

            {/* Theme Toggle - Desktop */}
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>

            {/* Account Icon - Mobile/Tablet */}
            <Link
              href="/account" 
              className="p-3 lg:hidden hover:bg-muted rounded-full transition-colors"
              style={{ touchAction: "manipulation" }}
              aria-label="My Account"
            >
              <User className="w-6 h-6 text-foreground" />
            </Link>

            {/* Cart - desktop (phones have it in the bottom tab bar) */}
            <button 
              onClick={() => toggleCart(true)} 
              className="max-lg:hidden p-3 -mr-2 lg:-mr-0 lg:px-2 lg:py-2 hover:bg-muted rounded-full transition-colors flex items-center gap-2"
              style={{ touchAction: "manipulation" }}
              aria-label={`Shopping cart with ${itemCount} items`}
            >
              <span className="font-mono text-xs tracking-widest uppercase text-forest-600 hidden lg:inline">Cart</span>
              <span className="relative">
                <ShoppingBag className="w-6 h-6 lg:w-5 lg:h-5 text-foreground" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-0.5 bg-primary text-primary-foreground text-xs font-mono font-semibold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

    </motion.header>

    {/* Phone menu - rendered outside the header for proper z-index stacking */}
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <motion.div
            ref={mobileMenuRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[100] flex w-full flex-col bg-cream-100 shadow-2xl sm:w-[400px]"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-forest-200 pl-6 pr-3">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2" aria-label="Muffin Plants - Home">
                <Image src="/logo-nav.png" alt="" width={37} height={40} className="h-8 w-auto object-contain" />
                <span className="font-serif text-lg text-forest-950">Muffin Plants</span>
              </Link>
              <button
                type="button"
                data-menu-close
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-full text-forest-900 hover:bg-forest-100 transition-colors touch-target"
                aria-label="Close navigation menu"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-10 pt-5">
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); openSearch() }}
                className="flex min-h-12 w-full items-center gap-3 rounded-full border border-forest-300 bg-surface px-5 text-left font-mono text-sm text-forest-600"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
                Search plants
              </button>

              <nav aria-label="Main" className="mt-4">
                <ul className="divide-y divide-forest-200">
                  {mainNav.map((item) =>
                    item.hasMegaMenu ? (
                      <li key={item.id}>
                        <div className="flex items-stretch">
                          <Link
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex min-h-14 flex-1 items-center font-serif text-2xl text-forest-950 hover:text-clay-500 transition-colors"
                          >
                            {item.label}
                          </Link>
                          <button
                            type="button"
                            onClick={() => setMenuShopOpen((open) => !open)}
                            aria-expanded={menuShopOpen}
                            aria-controls="mobile-shop-sections"
                            aria-label={menuShopOpen ? "Hide shop categories" : "Show shop categories"}
                            className="flex w-14 items-center justify-center text-forest-700"
                          >
                            <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${menuShopOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                          </button>
                        </div>
                        {menuShopOpen && (
                          <div id="mobile-shop-sections" className="space-y-6 pb-6 pt-1">
                            {shopMegaMenuSections.map((section) => (
                              <div key={section.id}>
                                <h2 className="mb-1 font-mono text-xs uppercase tracking-widest text-forest-500">
                                  {section.href ? (
                                    <Link href={section.href} onClick={() => setMobileMenuOpen(false)} className="inline-flex min-h-11 items-center hover:text-clay-600 transition-colors">
                                      {section.title}
                                    </Link>
                                  ) : (
                                    section.title
                                  )}
                                </h2>
                                <ul className="grid grid-cols-2 gap-x-4">
                                  {section.items.map((sub) => (
                                    <li key={sub.id}>
                                      <Link
                                        href={sub.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex min-h-11 items-center text-forest-800 hover:text-clay-600 transition-colors"
                                      >
                                        {sub.label}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                            <Link
                              href="/shop/all"
                              onClick={() => setMobileMenuOpen(false)}
                              className="inline-flex min-h-11 items-center gap-2 font-mono text-xs uppercase tracking-widest text-clay-600"
                            >
                              View all products <span aria-hidden="true">→</span>
                            </Link>
                          </div>
                        )}
                      </li>
                    ) : (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex min-h-14 items-center gap-3 font-serif text-2xl text-forest-950 hover:text-clay-500 transition-colors"
                        >
                          {item.label}
                          {item.isAi && (
                            <Image
                              src={askMuffin.logo}
                              alt=""
                              width={askMuffin.logoWidth}
                              height={askMuffin.logoHeight}
                              className="h-8 w-auto object-contain dark:rounded-lg dark:bg-paper dark:px-1"
                            />
                          )}
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </nav>

              <div className="mt-6 border-t border-forest-200 pt-4">
                <h2 className="mb-1 font-mono text-xs uppercase tracking-widest text-forest-500">More</h2>
                <ul className="grid grid-cols-2 gap-x-4">
                  {moreLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center text-forest-800 hover:text-clay-600 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-forest-200 pt-4">
                <div className="flex gap-5 font-mono text-xs uppercase tracking-widest">
                  <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center text-forest-800 hover:text-clay-600">Account</Link>
                  <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center text-forest-800 hover:text-clay-600">Wishlist</Link>
                </div>
                <ThemeToggle />
              </div>

              <p className="mt-6 font-mono text-xs text-forest-500 max-w-xs">
                A different kind of plant shop. Curated in Karachi, built for real homes.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    <MobileTabBar onShop={() => openMobileMenu(true)} />
  </>
  )
}
