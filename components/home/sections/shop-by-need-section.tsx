"use client"

import Link from "next/link"
import { FadeIn, AnimatedHeading } from "@/components/home/shared/animations"
import { shopByNeedCategories } from "@/config/nav.config"

const descriptions: Record<string, string> = {
  "low-light-survivors": "Thrive where the sun doesn't shine",
  "balcony-rooftop": "Wind and heat warriors for outdoor spaces",
  "air-purifying": "Breathe better with research-backed greens",
  "pet-safe": "Non-toxic for curious cats and dogs",
  "beginner-proof": "Hard to kill, easy to love",
  "statement-plants": "Big, bold, and conversation-starting"
}

export function ShopByNeedSection() {
  const useCasesList = shopByNeedCategories.map((cat) => {
    const slug = cat.href.replace("/shop-by-need/", "")
    return {
      key: slug,
      title: cat.label,
      description: descriptions[slug] ?? "Curated for real homes",
    }
  })

  return (
    <section className="py-24 lg:py-32 bg-cream-100">
      <div className="container mx-auto px-6 lg:px-12">
        <FadeIn>
          <div className="mb-16">
            <span className="font-mono text-xs text-forest-500">004</span>
            <span className="mx-3 text-forest-300">/</span>
            <span className="font-mono text-xs tracking-widest text-forest-600">SHOP BY NEED</span>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h2 className="font-serif text-[clamp(2rem,6vw,4rem)] text-forest-950 leading-[0.95] tracking-tight mb-16">
            <AnimatedHeading lines={["Find your kind of green."]} />
          </h2>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCasesList.map((uc) => (
              <Link key={uc.key} href={`/shop-by-need/${uc.key}`} className="group p-8 bg-sprout-100 border border-forest-200/50 hover:border-sprout-300 hover:bg-sprout-300 transition-colors relative overflow-hidden">
                <span className="text-clay-500 text-2xl absolute top-6 right-6">*</span>
                <h3 className="font-serif text-2xl mb-2">{uc.title}</h3>
                <p className="font-mono text-xs tracking-widest text-forest-500 uppercase">{uc.description}</p>
              </Link>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
