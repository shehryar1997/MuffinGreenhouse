"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { FadeIn, AnimatedHeading } from "@/components/home/shared/animations"
import { SectionLabel } from "@/components/home/shared/section-label"
import { AgaveArt, AroidArt, CactusArt, CategoryArt, SansevieriaArt } from "@/components/home/shared/plant-art"

// Tiles sit on light, theme-independent colours (the illustrations use fixed brand colours), so ink text is safe.
const tiles = [
  { slug: "aroids", name: "Aroids", note: "Monstera, Pink Princess & friends", bg: "bg-[#E4ECD3]" },
  { slug: "sansevierias", name: "Sansevierias", note: "Upright, tough, forgiving", bg: "bg-[#F4E6C8]" },
  { slug: "agaves", name: "Agaves", note: "Sculptural rosettes", bg: "bg-[#F6DDCB]" },
  { slug: "mangaves", name: "Mangaves", note: "Spotted, speckled, collectable", bg: "bg-[#EBE3F0]" },
  { slug: "hoyas", name: "Hoyas", note: "Trailing wax vines", bg: "bg-[#F6DDE4]" },
  { slug: "orchids", name: "Orchids", note: "Blooms that last", bg: "bg-[#E6ECDA]" },
  { slug: "cacti-succulents", name: "Cacti & Succulents", note: "Sun lovers", bg: "bg-[#F4E6C8]" },
  { slug: "pots", name: "Pots & supplies", note: "Pots, soil & fertilizer", bg: "bg-[#F6DDCB]" },
]

export function CategoryTiles({ n }: { n: string }) {
  return (
    <section className="bg-cream-100 py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <FadeIn>
          <SectionLabel n={n} label="Shop the greenhouse" />
        </FadeIn>
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-serif text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.95] tracking-tight text-forest-950">
            <AnimatedHeading lines={["Pick a family,", "find your plant."]} />
          </h2>
          <FadeIn delay={0.2}>
            <Link
              href="/shop/all"
              className="group inline-flex items-center gap-3 border-b border-forest-300 pb-2 font-mono text-xs uppercase tracking-widest text-forest-800 transition-colors hover:border-clay-500 hover:text-clay-600"
            >
              Browse everything
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </FadeIn>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {/* The big tile: everything in one place. */}
          <FadeIn delay={0.05} className="col-span-2 lg:row-span-2">
            <Link
              href="/shop/all"
              className="group relative flex h-full min-h-[22rem] flex-col justify-between overflow-hidden rounded-3xl bg-ink p-7 text-paper dark:bg-forest-100 dark:ring-1 dark:ring-paper/10 lg:min-h-[32rem] lg:p-9"
            >
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-sprout-300">Everything in one place</span>
                <h3 className="mt-3 font-serif text-4xl leading-none sm:text-5xl">All plants</h3>
                <p className="mt-3 max-w-[16rem] text-sm text-paper/70">Every plant in the greenhouse, with light, water and pet notes on each.</p>
              </div>
              <div className="pointer-events-none relative mt-6 flex items-end justify-center gap-2 sm:gap-4" aria-hidden="true">
                <SansevieriaArt className="h-32 w-32 rotate-[-4deg] transition-transform duration-500 group-hover:-translate-y-2 group-hover:-rotate-6 sm:h-44 sm:w-44 lg:h-52 lg:w-52" />
                <AroidArt className="-mb-1 h-40 w-40 transition-transform duration-500 group-hover:-translate-y-3 sm:h-56 sm:w-56 lg:h-64 lg:w-64" />
                <CactusArt className="h-28 w-28 rotate-[4deg] transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-6 sm:h-40 sm:w-40 lg:h-48 lg:w-48" />
                <AgaveArt className="absolute -right-2 -top-24 hidden h-28 w-28 rotate-12 opacity-90 lg:block" />
              </div>
              <span className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-sprout-300 text-ink transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
              </span>
            </Link>
          </FadeIn>

          {tiles.map((tile, i) => (
            <FadeIn key={tile.slug} delay={0.08 + i * 0.05}>
              <Link
                href={`/shop/${tile.slug}`}
                className={`group relative flex h-full min-h-[13rem] flex-col justify-between overflow-hidden rounded-3xl p-5 text-ink transition-transform duration-300 hover:-translate-y-1 sm:min-h-[15rem] sm:p-6 ${tile.bg}`}
              >
                <div className="relative z-10">
                  <h3 className="font-serif text-xl leading-tight sm:text-2xl">{tile.name}</h3>
                  <p className="mt-1 max-w-[11rem] text-xs text-ink/65 sm:text-sm">{tile.note}</p>
                </div>
                <CategoryArt
                  slug={tile.slug}
                  className="pointer-events-none absolute -bottom-3 -right-3 h-28 w-28 origin-bottom transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 sm:h-36 sm:w-36"
                />
                <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-ink/90 text-paper opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
