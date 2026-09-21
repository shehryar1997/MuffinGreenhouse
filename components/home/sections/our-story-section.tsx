"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock, Thermometer, Wind } from "lucide-react"
import { FadeIn, AnimatedHeading } from "@/components/home/shared/animations"
import { SectionLabel } from "@/components/home/shared/section-label"

const traits = [
  { icon: Thermometer, title: "Heat", text: "We only stock plants that cope with Karachi's long, hot summers." },
  { icon: Wind, title: "Dust", text: "Tough enough for a dusty balcony and a busy household." },
  { icon: Clock, title: "Occasional neglect", text: "Forgiving when life gets busy and watering slips." },
]

export function OurStorySection({ n }: { n: string }) {
  return (
    <section className="border-t border-forest-200/50 bg-cream-100 py-12 lg:py-14">
      <div className="container mx-auto px-6 lg:px-12">
        <FadeIn>
          <SectionLabel n={n} label="Our story" />
        </FadeIn>

        <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="relative lg:col-span-7">
            <h2 className="font-serif leading-[0.95] tracking-tight">
              <AnimatedHeading
                lines={["We killed a lot of", "plants so you", "do not have to."]}
                className={["text-[clamp(2.25rem,6.5vw,5rem)] text-forest-950", "text-[clamp(2.25rem,6.5vw,5rem)] text-forest-950", "text-[clamp(2.25rem,6.5vw,5rem)] text-clay-500"]}
              />
            </h2>
            {/* The greenhouse mark, stuck on like a sticker. */}
            <FadeIn delay={0.3}>
              <div className="mt-10 flex items-center gap-5">
                <span className="flex h-20 w-20 rotate-[-8deg] items-center justify-center rounded-full bg-paper shadow-lg ring-1 ring-forest-200/60">
                  <Image src="/logo-nav.png" alt="" width={37} height={40} className="h-11 w-auto" />
                </span>
                <p className="max-w-[14rem] font-mono text-xs uppercase leading-relaxed tracking-widest text-forest-600">Muffin Greenhouse · Karachi</p>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.15} className="lg:col-span-5 lg:pt-4">
            <p className="text-lg text-forest-600">We stock only what we know thrives in Karachi heat, dust, and occasional neglect.</p>
            <ul className="mt-8 space-y-5">
              {traits.map((trait) => (
                <li key={trait.title} className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-100 text-clay-700 ring-1 ring-clay-200/60">
                    <trait.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-serif text-lg text-forest-950">{trait.title}</h3>
                    <p className="text-sm text-forest-600">{trait.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/our-story"
              className="group mt-10 inline-flex items-center gap-3 border-b border-forest-300 pb-2 font-mono text-xs uppercase tracking-widest text-forest-800 transition-colors hover:border-clay-500 hover:text-clay-500"
            >
              Read our story
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
