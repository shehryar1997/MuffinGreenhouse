"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, MessageCircle, ShieldCheck, Truck } from "lucide-react"
import { useParallax } from "@/hooks/use-parallax"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { formatPrice } from "@/lib/utils"
import { CategoryArt } from "@/components/home/shared/plant-art"
import type { Product } from "@/types"

// Above the fold, so it animates with CSS on first paint instead of waiting for JavaScript to load and hydrate
// (Framer's initial opacity:0 is server-rendered, which left the hero blank until hydration).
const rise = (delay: number): React.CSSProperties => ({ animationDelay: `${delay}s`, animationFillMode: "both" })

const HERO_IMAGE = "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&q=80"

function Underline() {
  return (
    <svg viewBox="0 0 400 24" className="absolute -bottom-1 left-0 h-3 w-[78%] text-secondary sm:h-4 lg:-bottom-2 lg:h-5" fill="none" aria-hidden="true" preserveAspectRatio="none">
      <path
        d="M4 16 C 60 4, 120 22, 190 12 S 320 6, 396 14"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
        className="animate-draw"
      />
    </svg>
  )
}

/** A slowly turning seal. The text runs around a circle; the star in the middle stays still. */
function Seal() {
  return (
    <div className="relative h-28 w-28 lg:h-32 lg:w-32">
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full animate-[spin_28s_linear_infinite] text-secondary-foreground" aria-hidden="true">
        <circle cx="60" cy="60" r="60" className="fill-secondary" />
        <defs>
          <path id="seal-ring" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
        </defs>
        <text className="fill-current font-mono" fontSize="9" fontWeight="600" textLength="280" lengthAdjust="spacing">
          <textPath href="#seal-ring">SOURCED GLOBALLY ✦ PROPAGATED IN KARACHI ✦ </textPath>
        </text>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl text-secondary-foreground" aria-hidden="true">
        ✦
      </span>
    </div>
  )
}

function Arch({ reduced }: { reduced: boolean }) {
  const { offset, containerRef } = useParallax({ maxOffset: 8 })
  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>} className="relative">
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-full border-[12px] border-b-0 border-background">
        <div
          className="absolute inset-[-16px]"
          style={reduced ? undefined : { transform: `translate(${offset.x}px, ${offset.y}px)`, transition: "transform 50ms ease-out" }}
        >
          <Image src={HERO_IMAGE} alt="A Monstera held in a white pot" fill className="object-cover" priority sizes="(min-width: 1024px) 40vw, 90vw" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 h-3 bg-secondary" />
      </div>
    </div>
  )
}

export function Hero({ featured }: { featured?: Product }) {
  const reduced = useReducedMotion()

  return (
    <section className="relative overflow-hidden">
      {/* Soft colour behind the page, so the cream doesn't feel flat. */}
      <div className="pointer-events-none absolute -right-32 top-10 h-[34rem] w-[34rem] rounded-full bg-sprout-200/50 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-clay-200/30 blur-3xl" aria-hidden="true" />

      <div className="container relative mx-auto px-6 pb-20 pt-28 lg:px-12 lg:pb-28 lg:pt-32">
        <div className="animate-fade-in-up mb-8 flex items-center gap-4" style={rise(0)}>
          <span className="font-mono text-xs text-primary">001</span>
          <span className="h-px w-8 bg-border" />
          <span className="font-mono text-xs tracking-widest text-muted-foreground">A DIFFERENT KIND OF PLANT SHOP</span>
        </div>

        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1 className="font-serif text-[clamp(3rem,7.4vw,7rem)] leading-[0.95] tracking-tight">
              <span className="block animate-fade-in-up whitespace-nowrap text-foreground" style={rise(0.08)}>
                Good plants.
              </span>
              <span className="relative block animate-fade-in-up whitespace-nowrap pb-3 text-primary" style={rise(0.2)}>
                Good energy.
                <Underline />
              </span>
            </h1>

            <p className="animate-fade-in-up mt-8 max-w-md text-lg text-muted-foreground" style={rise(0.35)}>
              Green things worth collecting, sourced from around the world and acclimated for Pakistan.
            </p>

            <div className="animate-fade-in-up mt-9 flex flex-wrap gap-3" style={rise(0.45)}>
              <Link
                href="/shop/all"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-mono text-xs uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Shop plants
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="/plant-finder"
                className="inline-flex items-center gap-2 rounded-full border border-foreground/30 px-7 py-3.5 font-mono text-xs uppercase tracking-widest text-foreground transition hover:-translate-y-0.5 hover:border-foreground hover:bg-foreground/5"
              >
                Find your plant
              </Link>
            </div>

            <ul className="animate-fade-in-up mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted-foreground" style={rise(0.55)}>
              <li className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" aria-hidden="true" /> Delivered across Pakistan
              </li>
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" /> 2-hour damage cover
              </li>
              <li className="inline-flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" /> Free pickup, arranged on WhatsApp
              </li>
            </ul>
          </div>

          <div className="animate-fade-in-up relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none" style={rise(0.25)}>
            <Arch reduced={reduced} />

            <div className="absolute -left-3 top-8 z-20 sm:-left-8 lg:-left-10">
              <Seal />
            </div>

            <span className="absolute -right-1 top-24 z-20 animate-float text-3xl text-secondary drop-shadow sm:-right-4" aria-hidden="true">
              ✦
            </span>
            <span className="absolute -left-2 bottom-40 z-20 animate-float text-xl text-primary [animation-delay:1.5s]" aria-hidden="true">
              ✦
            </span>

            {featured && (
              <Link
                href={`/shop/product/${featured.slug}`}
                className="group absolute -bottom-4 left-3 z-20 flex max-w-[16rem] items-center gap-3 rounded-2xl border border-border bg-surface p-3 pr-4 shadow-xl transition hover:-translate-y-1 sm:-left-6"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EEF3DC]">
                  <CategoryArt slug={featured.category.slug} className="h-11 w-11" />
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-primary">Just in</span>
                  <span className="block truncate font-serif text-base leading-tight text-foreground">{featured.name}</span>
                  <span className="block font-mono text-xs text-muted-foreground">{formatPrice(featured.price)}</span>
                </span>
                <ArrowRight className="ml-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
