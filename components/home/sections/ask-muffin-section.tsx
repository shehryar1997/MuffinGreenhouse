"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FadeIn, AnimatedHeading } from "@/components/home/shared/animations"
import { SectionLabel } from "@/components/home/shared/section-label"
import { askMuffin } from "@/config/nav.config"
import { MUFFIN_QUICK_REPLIES } from "@/lib/muffin-engine"

export function AskMuffinSection({ n }: { n: string }) {
  return (
    <section className="relative overflow-hidden bg-ink py-24 text-paper lg:py-32">
      <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-sprout-300/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-clay-500/20 blur-3xl" aria-hidden="true" />

      <div className="container relative mx-auto px-6 lg:px-12">
        <FadeIn>
          <SectionLabel n={n} label="Ask Muffin" tone="light" />
        </FadeIn>

        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="font-serif text-[clamp(3rem,9vw,7rem)] leading-[0.9] tracking-tight">
              <AnimatedHeading lines={["Ask Muffin."]} className="text-paper" />
            </h2>
            <FadeIn delay={0.15}>
              <p className="mt-7 max-w-md text-lg text-paper/75">Not sure which plant suits your window? Tell Muffin about your light, your pets and how often you remember to water.</p>
              <div className="mt-8 flex flex-wrap gap-2.5">
                {MUFFIN_QUICK_REPLIES.slice(0, 4).map((reply) => (
                  <Link
                    key={reply}
                    href="/muffin"
                    className="rounded-full border border-paper/25 px-4 py-2 text-sm text-paper/90 transition hover:-translate-y-0.5 hover:border-sprout-300 hover:bg-sprout-300 hover:text-ink"
                  >
                    {reply}
                  </Link>
                ))}
              </div>
              <Link
                href="/muffin"
                className="group mt-10 inline-flex items-center gap-3 rounded-full bg-sprout-300 px-7 py-3.5 font-mono text-xs uppercase tracking-widest text-ink transition hover:-translate-y-0.5 hover:brightness-105"
              >
                Start chatting
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </FadeIn>
          </div>

          <FadeIn delay={0.2}>
            <Link href="/muffin" className="group relative mx-auto block max-w-md" aria-label="Chat with Ask Muffin">
              <div className="absolute -right-4 -top-14 z-10 animate-float sm:-right-10">
                <span className="flex h-28 w-28 items-center justify-center rounded-full bg-paper shadow-2xl ring-4 ring-ink sm:h-36 sm:w-36">
                  <Image src={askMuffin.logo} alt="" width={askMuffin.logoWidth} height={askMuffin.logoHeight} className="h-auto w-[78%] object-contain transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110" />
                </span>
              </div>

              <div className="space-y-4 rounded-[2rem] border border-paper/15 bg-paper/5 p-6 pt-10 backdrop-blur-sm sm:p-8 sm:pt-12">
                <p className="font-mono text-[11px] uppercase tracking-widest text-paper/50">Ask Muffin · plant guide</p>
                <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-paper px-4 py-3 text-sm text-ink">Hi! I am Muffin, your plant guide. What are you looking for today?</div>
                <div className="ml-auto max-w-[70%] rounded-2xl rounded-tr-md bg-clay-500 px-4 py-3 text-sm text-white">Low light survivors</div>
                <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-tl-md bg-paper px-4 py-3" aria-hidden="true">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-ink/50" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-ink/50 [animation-delay:200ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-ink/50 [animation-delay:400ms]" />
                </div>
                <div className="flex items-center justify-between rounded-full border border-paper/20 px-5 py-3 text-sm text-paper/50 transition group-hover:border-sprout-300 group-hover:text-paper/80">
                  Ask about plants...
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
            </Link>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
