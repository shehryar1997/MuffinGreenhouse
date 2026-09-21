"use client"

import Link from "next/link"
import { siteConfig } from "@/config/nav.config"

export function Footer({ clearTabBar = false }: { clearTabBar?: boolean }) {
  return (
    <footer className={`bg-secondary py-16 mt-auto${clearTabBar ? " max-lg:pb-[calc(4rem+3.5rem+env(safe-area-inset-bottom))]" : ""}`}>
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-10 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="max-lg:col-span-2">
            <div className="w-8 h-8 rounded-full border border-foreground flex items-center justify-center mb-4">
              <span className="text-sm">&#10022;</span>
            </div>
            <p className="text-secondary-foreground/80 text-sm max-w-xs">Good plants for good energy.</p>
            <p className="mt-4 text-sm"><Link href="/visit-us" className="text-foreground hover:opacity-60 transition-opacity max-lg:inline-flex max-lg:min-h-11 max-lg:items-center">Karachi · pickup on WhatsApp</Link></p>
            <p className="text-secondary-foreground/80 text-sm"><a href="mailto:support@muffinplants.com" className="hover:opacity-60 transition-opacity max-lg:inline-flex max-lg:min-h-11 max-lg:items-center">support@muffinplants.com</a></p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-mono text-xs tracking-widest uppercase text-secondary-foreground/80 mb-4">Shop</h3>
            <ul className="space-y-2 max-lg:space-y-0">
              <li><Link href="/shop/all" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">All plants</Link></li>
              <li><Link href="/plant-finder" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">Plant finder</Link></li>
              <li><Link href="/shop-by-need" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">Shop by need</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-mono text-xs tracking-widest uppercase text-secondary-foreground/80 mb-4">Help</h3>
            <ul className="space-y-2 max-lg:space-y-0">
              <li><Link href="/delivery-and-pickup" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">Delivery & pickup</Link></li>
              <li><Link href="/our-guarantee" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">Our guarantee</Link></li>
              <li><Link href="/faq" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">FAQ</Link></li>
              <li><Link href="/contact" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">Contact us</Link></li>
              <li><Link href="/account" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">My account</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-mono text-xs tracking-widest uppercase text-secondary-foreground/80 mb-4">Legal</h3>
            <ul className="space-y-2 max-lg:space-y-0">
              <li><Link href="/privacy-policy" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">Privacy Policy</Link></li>
              <li><Link href="/terms-conditions" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">Terms & Conditions</Link></li>
              <li><Link href="/refund-policy" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">Refund Policy</Link></li>
              <li><Link href="/cookie-policy" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Company: Our story / Visit us / Events / Journal / Reviews were built but linked from nowhere */}
          <div>
            <h3 className="font-mono text-xs tracking-widest uppercase text-secondary-foreground/80 mb-4">Company</h3>
            <ul className="space-y-2 max-lg:space-y-0">
              <li><Link href="/our-story" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">Our story</Link></li>
              <li><Link href="/visit-us" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">Visit us</Link></li>
              <li><Link href="/events" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">Events</Link></li>
              <li><Link href="/journal" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">Journal</Link></li>
              <li><Link href="/reviews" className="text-foreground text-sm hover:opacity-60 transition-opacity max-lg:flex max-lg:min-h-11 max-lg:items-center">Reviews</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-secondary-foreground/80">© {new Date().getFullYear()} Muffin / greenhouse</p>
          <div className="flex gap-6 max-lg:gap-2">
            <a href="https://www.instagram.com/muffinsgreenhouse/" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-secondary-foreground/80 hover:text-foreground transition-colors max-lg:inline-flex max-lg:min-h-11 max-lg:items-center max-lg:px-3">Instagram</a>
            <a href={`https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-secondary-foreground/80 hover:text-foreground transition-colors max-lg:inline-flex max-lg:min-h-11 max-lg:items-center max-lg:px-3">WhatsApp</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
