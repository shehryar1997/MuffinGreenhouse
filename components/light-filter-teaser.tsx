"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Sun, SunDim, SunMedium } from "lucide-react"
import { LightLevel, lightLevelLabels, getLightPreviewProducts } from "@/lib/plant-utils"
import { PlantTile } from "@/components/home/shared/plant-tile"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { Product } from "@/types"

interface LightFilterTeaserProps {
  products: Product[]
}

const lightIcons = { low: SunDim, medium: SunMedium, bright: Sun }
const lightNotes: Record<LightLevel, string> = {
  low: "North-facing rooms, corridors, a few metres from the window.",
  medium: "A bright room with no direct sun, or a couple of metres from a window.",
  bright: "Right by a sunny window, or a balcony with a few hours of sun.",
}

export function LightFilterTeaser({ products }: LightFilterTeaserProps) {
  const [selectedLight, setSelectedLight] = useState<LightLevel>("medium")
  const prefersReducedMotion = useReducedMotion()

  const lightOptions: LightLevel[] = ["low", "medium", "bright"]
  const previewProducts = useMemo(() => getLightPreviewProducts(products, selectedLight, 3), [products, selectedLight])

  return (
    <div className="rounded-[2rem] border border-forest-200/60 bg-surface p-6 shadow-sm sm:p-10 lg:p-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-4">
          <p className="font-mono text-xs uppercase tracking-widest text-forest-500">Quick preview by light</p>
          <h3 className="mt-3 font-serif text-3xl leading-tight text-forest-950">Wondering what works in your space?</h3>
          <p className="mt-3 text-forest-600">Tell us how much light you get and see what suits it.</p>

          <div className="mt-7 flex flex-col gap-2.5" role="group" aria-label="Light level">
            {lightOptions.map((light) => {
              const isSelected = selectedLight === light
              const Icon = lightIcons[light]
              return (
                <button
                  key={light}
                  onClick={() => setSelectedLight(light)}
                  aria-pressed={isSelected}
                  className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
                    isSelected ? "border-clay-500 bg-clay-500 text-white shadow-lg shadow-clay-500/20" : "border-forest-200 bg-transparent text-forest-800 hover:border-clay-400"
                  }`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isSelected ? "bg-white/20" : "bg-sprout-100 text-sprout-700"}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{lightLevelLabels[light]}</span>
                    <span className={`block text-xs ${isSelected ? "text-white/80" : "text-forest-500"}`}>{lightNotes[light]}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-8">
          {previewProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
              {previewProducts.map((product, index) => (
                <motion.div
                  key={`${selectedLight}-${product.id}`}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <PlantTile product={product} ratio="aspect-square" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[14rem] flex-col items-center justify-center rounded-2xl border border-dashed border-forest-200 p-8 text-center">
              <p className="font-serif text-xl text-forest-950">Nothing here for {lightLevelLabels[selectedLight].toLowerCase()} just yet.</p>
              <p className="mt-2 text-sm text-forest-600">Try another light level, or ask us on WhatsApp what&apos;s coming.</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-forest-200/60 pt-6">
            <Link href="/shop/all" className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-forest-700 transition-colors hover:text-clay-500">
              View all plants
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link href="/plant-finder" className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-forest-700 transition-colors hover:text-clay-500">
              Take the full plant finder
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
