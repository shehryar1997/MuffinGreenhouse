"use client"

import Link from "next/link"
import { ArrowUpRight, Moon, PawPrint, Sparkles, Sprout, Sun, Wind, type LucideIcon } from "lucide-react"
import { FadeIn, AnimatedHeading } from "@/components/home/shared/animations"
import { SectionLabel } from "@/components/home/shared/section-label"
import { shopByNeedCategories } from "@/config/nav.config"

// Light, theme-independent tile colours with ink text (like the category tiles above).
const meta: Record<string, { description: string; icon: LucideIcon; bg: string }> = {
  "low-light-survivors": { description: "Thrive where the sun doesn't shine", icon: Moon, bg: "bg-[#E4ECD3]" },
  "balcony-rooftop": { description: "Wind and heat warriors for outdoor spaces", icon: Sun, bg: "bg-[#F6E3B8]" },
  "air-purifying": { description: "Breathe better with research-backed greens", icon: Wind, bg: "bg-[#DCEBE6]" },
  "pet-safe": { description: "Non-toxic for curious cats and dogs", icon: PawPrint, bg: "bg-[#F6DDCB]" },
  "beginner-proof": { description: "Hard to kill, easy to love", icon: Sprout, bg: "bg-[#EAF3B5]" },
  "statement-plants": { description: "Big, bold, and conversation-starting", icon: Sparkles, bg: "bg-[#EBE3F0]" },
}

export function ShopByNeedSection({ n }: { n: string }) {
  const useCases = shopByNeedCategories.map((cat) => {
    const slug = cat.href.replace("/shop-by-need/", "")
    const info = meta[slug]
    return { slug, title: cat.label, description: info?.description ?? "Curated for real homes", icon: info?.icon ?? Sprout, bg: info?.bg ?? "bg-[#E4ECD3]" }
  })

  return (
    <section className="bg-cream-200 py-12 lg:py-14">
      <div className="container mx-auto px-6 lg:px-12">
        <FadeIn>
          <SectionLabel n={n} label="Shop by need" />
        </FadeIn>
        <h2 className="mb-8 font-serif text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.95] tracking-tight text-forest-950">
          <AnimatedHeading lines={["Find your kind of green."]} />
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((uc, i) => (
            <FadeIn key={uc.slug} delay={i * 0.06}>
              <Link
                href={`/shop-by-need/${uc.slug}`}
                className={`group relative flex h-full min-h-[11rem] flex-col justify-between overflow-hidden rounded-3xl p-6 text-ink transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7 ${uc.bg}`}
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110">
                    <uc.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-ink/40 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-ink" aria-hidden="true" />
                </div>
                <div className="mt-8">
                  <h3 className="font-serif text-2xl leading-tight">{uc.title}</h3>
                  <p className="mt-1 text-sm text-ink/70">{uc.description}</p>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
