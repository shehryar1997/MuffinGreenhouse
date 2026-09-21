"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowRight } from "lucide-react"
import { FadeIn, AnimatedHeading } from "@/components/home/shared/animations"
import { SectionLabel } from "@/components/home/shared/section-label"
import type { Product } from "@/types"

// Client-only (it holds the selected light level), and below the fold.
const LightFilterTeaser = dynamic(() => import("@/components/light-filter-teaser").then((mod) => ({ default: mod.LightFilterTeaser })), { ssr: false })

export function MethodSection({ products, n }: { products: Product[]; n: string }) {
  return (
    <section className="bg-forest-50 py-12 lg:py-14">
      <div className="container mx-auto px-6 lg:px-12">
        <FadeIn>
          <SectionLabel n={n} label="Our method" />
        </FadeIn>

        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-2 lg:gap-16">
          <h2 className="font-serif leading-[0.92] tracking-tight">
            <AnimatedHeading
              lines={["Less", "guesswork.", "More", "green."]}
              className={[
                "text-[clamp(2.75rem,8vw,6rem)] text-forest-950",
                "text-[clamp(2.75rem,8vw,6rem)] text-forest-950",
                "text-[clamp(2.75rem,8vw,6rem)] text-sprout-700",
                "text-[clamp(2.75rem,8vw,6rem)] text-sprout-700",
              ]}
            />
          </h2>
          <FadeIn delay={0.2}>
            <div className="max-w-md lg:pb-3">
              <p className="mb-8 text-lg text-forest-600">Tell us about your light, your space, your habits, and we&apos;ll match you with a plant built to thrive there.</p>
              <Link
                href="/plant-finder"
                className="group inline-flex items-center gap-3 rounded-full bg-forest-950 px-6 py-3.5 font-mono text-xs uppercase tracking-widest text-cream-50 transition hover:-translate-y-0.5 hover:bg-clay-500 hover:text-white"
              >
                Find your match
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.1}>
          <div className="mt-12 lg:mt-14">
            <LightFilterTeaser products={products} />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
