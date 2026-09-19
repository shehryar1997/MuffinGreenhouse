"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { shopMegaMenuSections } from "@/config/nav.config"
import { Star } from "lucide-react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

interface ShopMegaMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function ShopMegaMenu({ isOpen, onClose }: ShopMegaMenuProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    if (!isOpen) return null

    return (
      <>
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 top-20 bg-black/5 z-40"
          onClick={onClose}
        />
        
        {/* Mega menu content */}
        <div className="absolute left-0 right-0 top-full bg-cream-100 border-b border-forest-200/50 shadow-lg z-50">
          <div className="container mx-auto px-6 lg:px-12 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {shopMegaMenuSections.map((section) => (
                <div key={section.id} className="space-y-4">
                  {/* Section title */}
                  <h3 className="font-serif text-lg text-forest-900 border-b border-forest-200/50 pb-2">
                    {section.title}
                  </h3>
                  
                  {/* Section items */}
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="group flex items-center gap-2 font-mono text-sm text-forest-600 hover:text-forest-950 transition-colors py-1"
                          onClick={onClose}
                        >
                          <span className="relative">
                            {item.label}
                            {item.featured && (
                              <span className="absolute -right-3 -top-1">
                                <Star className="w-2.5 h-2.5 fill-clay-500 text-clay-500" />
                              </span>
                            )}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-20 bg-black/5 z-40"
            onClick={onClose}
          />
          
          {/* Mega menu content */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-full bg-cream-100 border-b border-forest-200/50 shadow-lg z-50"
          >
            <div className="container mx-auto px-6 lg:px-12 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                {shopMegaMenuSections.map((section) => (
                  <div key={section.id} className="space-y-4">
                    {/* Section title */}
                    <h3 className="font-serif text-lg text-forest-900 border-b border-forest-200/50 pb-2">
                      {section.title}
                    </h3>
                    
                    {/* Section items */}
                    <ul className="space-y-2">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            className="group flex items-center gap-2 font-mono text-sm text-forest-600 hover:text-forest-950 transition-colors py-1"
                            onClick={onClose}
                          >
                            <span className="relative">
                              {item.label}
                              {item.featured && (
                                <span className="absolute -right-3 -top-1">
                                  <Star className="w-2.5 h-2.5 fill-clay-500 text-clay-500" />
                                </span>
                              )}
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                              →
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
