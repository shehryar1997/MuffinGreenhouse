"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FadeIn, AnimatedHeading } from "@/components/home/shared/animations"

export function OurStorySection() {
  return (
    <section className="py-24 lg:py-32 bg-cream-100 border-t border-forest-200/50">
      <div className="container mx-auto px-6 lg:px-12">
        <FadeIn>
          <div className="mb-16">
            <span className="font-mono text-xs text-forest-500">005</span>
            <span className="mx-3 text-forest-300">/</span>
            <span className="font-mono text-xs tracking-widest text-forest-600">OUR STORY</span>
          </div>
        </FadeIn>
        <div className="grid lg:grid-cols-2 gap-16">
          <FadeIn delay={0.1}>
            <h2 className="font-serif leading-[0.95] tracking-tight">
              <AnimatedHeading
                lines={["We killed a lot of", "plants", "so you do not have to."]}
                className="text-[clamp(2rem,6vw,4rem)] text-forest-950 whitespace-nowrap"
              />
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="lg:pt-16">
              <p className="text-forest-600 text-lg mb-8 max-w-sm">We stock only what we know thrives in Karachi heat, dust, and occasional neglect.</p>
              <Link href="/our-story" className="inline-flex items-center gap-3 font-mono text-xs tracking-widest uppercase border-b border-forest-300 pb-2 hover:text-clay-500 hover:border-clay-500 transition-colors group">
                Read Our Story
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
