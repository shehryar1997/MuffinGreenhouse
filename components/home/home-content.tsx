"use client"

import dynamic from "next/dynamic"
import { Hero } from "@/components/home/sections/hero"
import { TrustStrip } from "@/components/home/sections/trust-strip"
import { CategoryTiles } from "@/components/home/sections/category-tiles"
import { FeaturedPlants, latestProducts } from "@/components/home/sections/featured-plants"
import type { Event, JournalPost, Product } from "@/types"

// Below-the-fold sections are code-split. They still render on the server (no ssr: false), so their content stays
// visible to search engines; the skeleton only shows while the chunk loads.
const MethodSection = dynamic(() => import("./sections/method-section").then((m) => ({ default: m.MethodSection })), { loading: () => <SectionSkeleton /> })
const ShopByNeedSection = dynamic(() => import("./sections/shop-by-need-section").then((m) => ({ default: m.ShopByNeedSection })), { loading: () => <SectionSkeleton /> })
const AskMuffinSection = dynamic(() => import("./sections/ask-muffin-section").then((m) => ({ default: m.AskMuffinSection })), { loading: () => <SectionSkeleton /> })
const OurStorySection = dynamic(() => import("./sections/our-story-section").then((m) => ({ default: m.OurStorySection })), { loading: () => <SectionSkeleton /> })
const JournalSection = dynamic(() => import("./sections/journal-section").then((m) => ({ default: m.JournalSection })), { loading: () => <SectionSkeleton /> })
const EventsSection = dynamic(() => import("./sections/events-section").then((m) => ({ default: m.EventsSection })), { loading: () => <SectionSkeleton /> })
const FinalCta = dynamic(() => import("./sections/final-cta").then((m) => ({ default: m.FinalCta })), { loading: () => <SectionSkeleton /> })

function SectionSkeleton() {
  return (
    <div className="animate-pulse py-16 lg:py-20">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-8 h-8 w-1/4 rounded bg-forest-100" />
        <div className="h-64 rounded bg-forest-100" />
      </div>
    </div>
  )
}

const marqueeLines = [
  "Curated for the modern collector",
  "Rare plants for one of a kind spaces",
  "We are here for every leaf, long after purchase",
  "Hand-picked before they ever reach you",
]

function Marquee() {
  // Four identical groups, moved by half their total width: the loop is seamless even on very wide screens.
  // Reduced-motion visitors get a still strip (the global reduced-motion rule stops the animation).
  return (
    <section className="overflow-hidden bg-ink py-5 dark:border-y dark:border-paper/10" aria-label="Highlights">
      <div className="flex w-max animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
        {[0, 1, 2, 3].map((group) => (
          <div key={group} className="flex shrink-0 items-center gap-12 pr-12" aria-hidden={group > 0}>
            {marqueeLines.map((line) => (
              <span key={line} className="flex items-center gap-12">
                <span className="font-serif text-lg text-paper">{line}</span>
                <span className="text-lg text-sprout-300">&#10022;</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

export default function HomeContent({ products, events, posts }: { products: Product[]; events: Event[]; posts: JournalPost[] }) {
  // Sections are numbered in the order they actually appear, so skipped ones (no plants yet, no posts yet) leave no gap.
  let count = 1
  const next = () => String(++count).padStart(3, "0")

  const latest = latestProducts(products, 10)
  const showFeatured = products.length > 0

  return (
    <div className="bg-background">
      <Hero latest={latest} />
      <Marquee />
      <TrustStrip />
      <CategoryTiles n={next()} />
      {showFeatured && <FeaturedPlants products={products} n={next()} />}
      <MethodSection products={products} n={next()} />
      <ShopByNeedSection n={next()} />
      <AskMuffinSection n={next()} />
      <OurStorySection n={next()} />
      {posts.length > 0 && <JournalSection posts={posts} n={next()} />}
      <EventsSection events={events} n={next()} />
      <FinalCta />
    </div>
  )
}
