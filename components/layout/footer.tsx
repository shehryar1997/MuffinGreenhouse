"use client"

import Link from "next/link"
import { siteConfig, footerNav } from "@/config/nav.config"

export function Footer() {
  return (
    <footer className="bg-secondary py-16 mt-auto">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="w-8 h-8 rounded-full border border-foreground flex items-center justify-center mb-4">
              <span className="text-sm">&#10022;</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">Good plants for good energy.</p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-mono text-xs tracking-widest uppercase text-muted-foreground mb-4">Shop</h3>
            <ul className="space-y-2">
              <li><Link href="/shop/all" className="text-foreground text-sm hover:opacity-60 transition-opacity">All plants</Link></li>
              <li><Link href="/shop-by-need" className="text-foreground text-sm hover:opacity-60 transition-opacity">Plant finder</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-mono text-xs tracking-widest uppercase text-muted-foreground mb-4">Help</h3>
            <ul className="space-y-2">
              <li><Link href="/delivery-and-pickup" className="text-foreground text-sm hover:opacity-60 transition-opacity">Delivery & pickup</Link></li>
              <li><Link href="/our-guarantee" className="text-foreground text-sm hover:opacity-60 transition-opacity">Our guarantee</Link></li>
              <li><Link href="/faq" className="text-foreground text-sm hover:opacity-60 transition-opacity">FAQ</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-mono text-xs tracking-widest uppercase text-muted-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy-policy" className="text-foreground text-sm hover:opacity-60 transition-opacity">Privacy Policy</Link></li>
              <li><Link href="/terms-conditions" className="text-foreground text-sm hover:opacity-60 transition-opacity">Terms & Conditions</Link></li>
              <li><Link href="/refund-policy" className="text-foreground text-sm hover:opacity-60 transition-opacity">Refund Policy</Link></li>
              <li><Link href="/cookie-policy" className="text-foreground text-sm hover:opacity-60 transition-opacity">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Visit */}
          <div>
            <h3 className="font-mono text-xs tracking-widest uppercase text-muted-foreground mb-4">Visit</h3>
            <p className="text-foreground text-sm">Lane 5, DHA Phase 6</p>
            <p className="text-muted-foreground text-sm">Daily 10am to 7pm</p>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-muted-foreground">© {new Date().getFullYear()} Muffin / greenhouse</p>
          <div className="flex gap-6">
            <a href="https://www.instagram.com/muffinsgreenhouse/" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">Instagram</a>
            <a href={`https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">WhatsApp</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
