"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowRight, HeartHandshake, Sprout, Sun } from "lucide-react"
import { FadeIn, AnimatedHeading } from "@/components/home/shared/animations"
import { SectionLabel } from "@/components/home/shared/section-label"
import type { Product } from "@/types"

// Client-only (it holds the selected light level), and below the fold.
const LightFilterTeaser = dynamic(() => import("@/components/light-filter-teaser").then((mod) => ({ default: mod.LightFilterTeaser })), { ssr: false })

const steps = [
  { icon: Sun, title: "Choose your light", desc: "Sun, shade, or somewhere in between. Tell us how your space lives." },
  { icon: Sprout, title: "Meet your plant", desc: "Matched from our current rarities, not a generic list." },
  { icon: HeartHandshake, title: "Keep it alive", desc: "Considered care, from someone who stays with you after." },
]

export function MethodSection({ products, n }: { products: Product[]; n: string }) {
  return (
    <section className="bg-forest-50 py-24 lg:py-32">
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

        {/* Three steps, joined by a dashed line on wide screens. */}
        <ol className="relative mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mt-20">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-forest-300/70 md:block" aria-hidden="true" />
          {steps.map((step, i) => (
            <li key={step.title}>
              <FadeIn delay={i * 0.12}>
                <div className="relative text-center md:text-left">
                  <span className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-950 text-sprout-300 ring-8 ring-forest-50 md:mx-0">
                    <step.icon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <p className="mt-5 font-mono text-xs text-clay-500">0{i + 1}</p>
                  <h3 className="mt-1 font-serif text-2xl text-forest-950">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-forest-600 md:mx-0">{step.desc}</p>
                </div>
              </FadeIn>
            </li>
          ))}
        </ol>

        <FadeIn delay={0.1}>
          <div className="mt-16 lg:mt-20">
            <LightFilterTeaser products={products} />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
