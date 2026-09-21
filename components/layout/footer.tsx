"use client"

import Image from "next/image"
import Link from "next/link"
import { siteConfig } from "@/config/nav.config"
import { NewsletterSignup } from "./newsletter-signup"

const linkClass = "text-forest-900 text-sm transition-colors hover:text-primary max-lg:flex max-lg:min-h-11 max-lg:items-center"
const headingClass = "font-mono text-xs tracking-widest uppercase text-forest-600 mb-4"
const socialClass = "font-mono text-xs text-forest-700 transition-colors hover:text-primary max-lg:inline-flex max-lg:min-h-11 max-lg:items-center max-lg:px-3"

// Decorative monstera leaf: slits and holes are cut out with a mask, so it takes its colour from currentColor.
function MonsteraLeaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 210" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <mask id="monstera-cutouts" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="210">
          <rect width="200" height="210" fill="white" />
          <g stroke="black" strokeLinecap="round" fill="none">
            <g strokeWidth="7">
              <path d="M6 108 L58 116" /><path d="M10 146 L60 146" /><path d="M32 182 L70 168" /><path d="M22 68 L64 92" /><path d="M54 34 L80 70" />
              <path d="M194 108 L142 116" /><path d="M190 146 L140 146" /><path d="M168 182 L130 168" /><path d="M178 68 L136 92" /><path d="M146 34 L120 70" />
            </g>
            <path d="M100 200 L100 24" strokeWidth="2.5" />
          </g>
          <g fill="black">
            <ellipse cx="80" cy="128" rx="6" ry="9" transform="rotate(-20 80 128)" /><ellipse cx="120" cy="128" rx="6" ry="9" transform="rotate(20 120 128)" />
            <ellipse cx="82" cy="98" rx="4.5" ry="7" transform="rotate(-25 82 98)" /><ellipse cx="118" cy="98" rx="4.5" ry="7" transform="rotate(25 118 98)" />
            <ellipse cx="84" cy="164" rx="5" ry="7" transform="rotate(-15 84 164)" /><ellipse cx="116" cy="164" rx="5" ry="7" transform="rotate(15 116 164)" />
          </g>
        </mask>
      </defs>
      <path mask="url(#monstera-cutouts)" d="M100 196 C70 208 10 188 6 122 C3 62 48 20 100 4 C152 20 197 62 194 122 C190 188 130 208 100 196 Z" />
    </svg>
  )
}

export function Footer({ clearTabBar = false }: { clearTabBar?: boolean }) {
  return (
    <footer className={`relative overflow-hidden bg-cream-200 border-t border-forest-200 py-16 mt-auto${clearTabBar ? " max-lg:pb-[calc(4rem+3.5rem+env(safe-area-inset-bottom))]" : ""}`}>
      <MonsteraLeaf className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-auto rotate-[24deg] text-forest-600 opacity-[0.07] dark:opacity-[0.09] lg:-bottom-32 lg:right-8 lg:h-[30rem]" />
      <div className="container relative mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-10 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="max-lg:col-span-2">
            <Link href="/" aria-label="Muffin Plants - Home" className="mb-4 inline-flex flex-col items-start gap-1 hover:opacity-80 transition-opacity">
              <Image src="/logo-nav.png" alt="" width={37} height={40} className="h-10 w-auto object-contain" />
              <span className="font-serif text-xs text-forest-950 leading-none">Muffin Plants</span>
            </Link>
            <p className="text-forest-700 text-sm max-w-xs">Good plants for good energy.</p>
            <p className="mt-4 text-forest-700 text-sm"><a href="mailto:support@muffinplants.com" className="transition-colors hover:text-primary max-lg:inline-flex max-lg:min-h-11 max-lg:items-center">support@muffinplants.com</a></p>
          </div>

          {/* Shop */}
          <div>
            <h3 className={headingClass}>Shop</h3>
            <ul className="space-y-2 max-lg:space-y-0">
              <li><Link href="/shop/all" className={linkClass}>All plants</Link></li>
              <li><Link href="/shop/tools-equipment" className={linkClass}>Tools & Equipment</Link></li>
              <li><Link href="/plant-finder" className={linkClass}>Plant finder</Link></li>
              <li><Link href="/shop-by-need" className={linkClass}>Shop by need</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className={headingClass}>Help</h3>
            <ul className="space-y-2 max-lg:space-y-0">
              <li><Link href="/delivery-and-pickup" className={linkClass}>Delivery & pickup</Link></li>
              <li><Link href="/our-guarantee" className={linkClass}>Our guarantee</Link></li>
              <li><Link href="/faq" className={linkClass}>FAQ</Link></li>
              <li><Link href="/contact" className={linkClass}>Contact us</Link></li>
              <li><Link href="/account" className={linkClass}>My account</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className={headingClass}>Legal</h3>
            <ul className="space-y-2 max-lg:space-y-0">
              <li><Link href="/privacy-policy" className={linkClass}>Privacy Policy</Link></li>
              <li><Link href="/terms-conditions" className={linkClass}>Terms & Conditions</Link></li>
              <li><Link href="/refund-policy" className={linkClass}>Refund Policy</Link></li>
              <li><Link href="/cookie-policy" className={linkClass}>Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Company: Our story / Visit us / Events / Journal / Reviews were built but linked from nowhere */}
          <div>
            <h3 className={headingClass}>Company</h3>
            <ul className="space-y-2 max-lg:space-y-0">
              <li><Link href="/our-story" className={linkClass}>Our story</Link></li>
              <li><Link href="/visit-us" className={linkClass}>Visit us</Link></li>
              <li><Link href="/events" className={linkClass}>Events</Link></li>
              <li><Link href="/journal" className={linkClass}>Journal</Link></li>
              <li><Link href="/reviews" className={linkClass}>Reviews</Link></li>
            </ul>
          </div>
        </div>

        <NewsletterSignup />

        <div className="border-t border-forest-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-forest-700">© {new Date().getFullYear()} Muffin / greenhouse</p>
          <div className="flex gap-6 max-lg:gap-2">
            <a href="https://www.instagram.com/muffinsgreenhouse/" target="_blank" rel="noopener noreferrer" className={socialClass}>Instagram</a>
            <a href={`https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className={socialClass}>WhatsApp</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
