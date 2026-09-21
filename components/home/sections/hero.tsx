"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Pause, Play } from "lucide-react"
import { useParallax } from "@/hooks/use-parallax"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { cn, formatPrice } from "@/lib/utils"
import { CategoryArt } from "@/components/home/shared/plant-art"
import { HERO_SLIDES, type HeroSlide } from "@/config/hero-slides"
import type { Product } from "@/types"

// Above the fold, so it animates with CSS on first paint instead of waiting for JavaScript to load and hydrate
// (Framer's initial opacity:0 is server-rendered, which left the hero blank until hydration).
const rise = (delay: number): React.CSSProperties => ({ animationDelay: `${delay}s`, animationFillMode: "both" })

/** How long each slide stays up. The active indicator's fill animation runs for exactly this long and its end advances the slide. */
const SLIDE_MS = 5000
/** How long each product stays on the "Just in" card. */
const JUST_IN_MS = 4000
const SLIDE_COUNT = HERO_SLIDES.length
const SWIPE_PX = 50

type Dir = 1 | -1
type Status = "active" | "leaving" | "hidden"
interface CarouselState {
  cur: number
  prev: number
  dir: Dir
  /** False until the first change, so slide 1 is static on first paint (no entrance animation on the LCP image). */
  animate: boolean
}

const statusOf = (i: number, s: CarouselState): Status => (i === s.cur ? "active" : s.animate && i === s.prev ? "leaving" : "hidden")

const motionClass = (status: Status, animate: boolean) =>
  status === "hidden" ? "invisible" : status === "leaving" ? "animate-hero-out" : animate ? "animate-hero-in" : ""

/** Travel distance and end-of-travel opacity for the hero-in / hero-out keyframes. Reduced motion: distance 0 makes it a crossfade. */
const motionVars = (x: string, opacity: number, dir: Dir, reduced: boolean) =>
  ({ "--hero-x": reduced ? "0px" : x, "--hero-o": reduced ? 0 : opacity, "--hero-dir": dir }) as React.CSSProperties

const noopSubscribe = () => () => {}
const subscribeVisibility = (cb: () => void) => {
  document.addEventListener("visibilitychange", cb)
  return () => document.removeEventListener("visibilitychange", cb)
}

function Underline({ active }: { active: boolean }) {
  // Drawn when its slide becomes active; left fully drawn while the slide slides out.
  return (
    <svg viewBox="0 0 400 24" className="absolute -bottom-1 left-0 h-3 w-[78%] text-secondary sm:h-4 lg:-bottom-2 lg:h-5" fill="none" aria-hidden="true" preserveAspectRatio="none">
      <path
        d="M4 16 C 60 4, 120 22, 190 12 S 320 6, 396 14"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: active ? 1 : 0 }}
        className={active ? "animate-draw" : undefined}
      />
    </svg>
  )
}

function Arch({ reduced, slides, state }: { reduced: boolean; slides: readonly HeroSlide[]; state: CarouselState }) {
  const { offset, containerRef } = useParallax({ maxOffset: 8 })
  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>} className="relative">
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-full border-[12px] border-b-0 border-background">
        <div
          className="absolute inset-[-16px]"
          style={reduced ? undefined : { transform: `translate(${offset.x}px, ${offset.y}px)`, transition: "transform 50ms ease-out" }}
        >
          {slides.map((slide, i) => {
            const status = statusOf(i, state)
            return (
              <div
                key={slide.id}
                className={cn("absolute inset-0", motionClass(status, state.animate))}
                style={motionVars("100%", 1, state.dir, reduced)}
                inert={status !== "active"}
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  className="object-cover"
                  style={{ objectPosition: slide.objectPosition }}
                  priority={i === 0}
                  // object-cover scales the whole landscape photo up to the portrait frame's height, so the file is
                  // ~2.5x the frame's width. A smaller hint makes Next serve a too-small file, which then looks blurry.
                  sizes="(min-width: 1024px) 100vw, (min-width: 500px) 1120px, 225vw"
                />
              </div>
            )
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 h-3 bg-secondary" />
      </div>
    </div>
  )
}

const primaryCta =
  "group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-mono text-xs uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:brightness-110"
const secondaryCta =
  "inline-flex items-center gap-2 rounded-full border border-foreground/30 px-7 py-3.5 font-mono text-xs uppercase tracking-widest text-foreground transition hover:-translate-y-0.5 hover:border-foreground hover:bg-foreground/5"

/** The "Just in" card: steps through the newest products. Stops under the same conditions as the slideshow (and for reduced motion). */
function JustIn({ products, paused }: { products: Product[]; paused: boolean }) {
  const [tick, setTick] = useState(0)
  const count = products.length

  useEffect(() => {
    if (paused || count < 2) return
    const id = setInterval(() => setTick((t) => t + 1), JUST_IN_MS)
    return () => clearInterval(id)
  }, [paused, count])

  if (count === 0) return null
  const product = products[tick % count]

  return (
    <div className="absolute -left-3 top-8 z-20 sm:-left-8 lg:-left-10">
      {/* Keyed so each new product fades in; the first one is already covered by the hero's own entrance. */}
      <div key={product.id} className={tick > 0 ? "animate-fade-in" : undefined}>
        <Link
          href={`/shop/product/${product.slug}`}
          className="group flex w-64 items-center gap-3 rounded-2xl border border-border bg-surface p-3 pr-4 shadow-xl transition hover:-translate-y-1"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EEF3DC]">
            <CategoryArt slug={product.category.slug} className="h-11 w-11" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-primary">Just in</span>
            <span className="block truncate font-serif text-base leading-tight text-foreground">{product.name}</span>
            <span className="block font-mono text-xs text-muted-foreground">{formatPrice(product.price)}</span>
          </span>
          <ArrowRight className="ml-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

export function Hero({ latest }: { latest: Product[] }) {
  const reduced = useReducedMotion()
  const [state, setState] = useState<CarouselState>({ cur: 0, prev: -1, dir: 1, animate: false })
  const [userPaused, setUserPaused] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [touching, setTouching] = useState(false)
  const docHidden = useSyncExternalStore(subscribeVisibility, () => document.hidden, () => false)
  // The progress animation drives autoplay and its end event needs a listener, so it only starts once hydrated.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const go = useCallback((to: number, dir: Dir = 1) => {
    setState((s) => (to === s.cur ? s : { cur: to, prev: s.cur, dir, animate: true }))
  }, [])
  const next = useCallback(() => setState((s) => ({ cur: (s.cur + 1) % SLIDE_COUNT, prev: s.cur, dir: 1, animate: true })), [])
  const previous = useCallback(() => setState((s) => ({ cur: (s.cur - 1 + SLIDE_COUNT) % SLIDE_COUNT, prev: s.cur, dir: -1, animate: true })), [])

  const holding = userPaused || hovering || focusWithin || touching || docHidden
  const autoplaying = !reduced && !holding

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
    setTouching(true)
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    setTouching(false)
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0) next()
    else previous()
  }

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured at Muffin"
      className="relative touch-pan-y overflow-hidden"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovering(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocusWithin(false)
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        touchStart.current = null
        setTouching(false)
      }}
    >
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
            {/* Every slide sits in the same grid cell, so the block is as tall as the tallest slide and nothing shifts. */}
            <div className="animate-fade-in-up grid" style={rise(0.08)} aria-live={autoplaying ? "off" : "polite"}>
              {HERO_SLIDES.map((slide, i) => {
                const status = statusOf(i, state)
                const Heading = i === 0 ? "h1" : "h2"
                return (
                  <div
                    key={slide.id}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${i + 1} of ${SLIDE_COUNT}`}
                    className={cn("col-start-1 row-start-1", motionClass(status, state.animate))}
                    style={{ ...motionVars("3rem", 0, state.dir, reduced), animationDelay: "80ms" }}
                    inert={status !== "active"}
                  >
                    <Heading className="font-serif text-[clamp(3rem,7.4vw,7rem)] leading-[0.95] tracking-tight">
                      <span className="block whitespace-nowrap text-foreground">{slide.headline[0]}</span>
                      <span className="relative block whitespace-nowrap pb-3 text-primary">
                        {slide.headline[1]}
                        <Underline active={status === "active"} />
                      </span>
                    </Heading>

                    <p className="mt-8 max-w-md text-lg text-muted-foreground">{slide.subcopy}</p>

                    <div className="mt-9 flex flex-wrap gap-3">
                      <Link href={slide.ctaHref} className={primaryCta}>
                        {slide.ctaLabel}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </Link>
                      {slide.secondaryCta && (
                        <Link href={slide.secondaryCta.href} className={secondaryCta}>
                          {slide.secondaryCta.label}
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="animate-fade-in-up mt-6 flex items-center gap-1" style={rise(0.45)}>
              <div className="flex items-center" role="group" aria-label="Choose a slide">
                {HERO_SLIDES.map((slide, i) => {
                  const active = i === state.cur
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      aria-label={`Go to slide ${i + 1} of ${SLIDE_COUNT}`}
                      aria-current={active ? "true" : undefined}
                      onClick={() => go(i)}
                      className="flex h-11 items-center px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full"
                    >
                      <span className="relative block h-1.5 w-8 overflow-hidden rounded-full bg-border sm:w-12">
                        {active && reduced && <span className="absolute inset-0 rounded-full bg-primary" />}
                        {active && !reduced && mounted && (
                          <span
                            key={state.cur}
                            className="absolute inset-0 origin-left rounded-full bg-primary animate-hero-progress"
                            style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: holding ? "paused" : "running" }}
                            onAnimationEnd={next}
                          />
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
              {!reduced && (
                <button
                  type="button"
                  aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                  onClick={() => setUserPaused((p) => !p)}
                  className="ml-2 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {userPaused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
                </button>
              )}
            </div>

            {/* Same stacking as the text above: the row is as tall as the tallest slide's highlights, so nothing shifts. */}
            <div className="animate-fade-in-up mt-10 grid" style={rise(0.55)}>
              {HERO_SLIDES.map((slide, i) => {
                const status = statusOf(i, state)
                return (
                  <ul
                    key={slide.id}
                    className={cn("col-start-1 row-start-1 flex flex-wrap content-start gap-x-7 gap-y-3 text-sm text-muted-foreground", motionClass(status, state.animate))}
                    style={{ ...motionVars("3rem", 0, state.dir, reduced), animationDelay: "160ms" }}
                  >
                    {slide.highlights.map(({ icon: Icon, text }) => (
                      <li key={text} className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" aria-hidden="true" /> {text}
                      </li>
                    ))}
                  </ul>
                )
              })}
            </div>
          </div>

          <div className="animate-fade-in-up relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none" style={rise(0.25)}>
            <Arch reduced={reduced} slides={HERO_SLIDES} state={state} />

            <span className="absolute -right-1 top-24 z-20 animate-float text-3xl text-secondary drop-shadow sm:-right-4" aria-hidden="true">
              ✦
            </span>
            <span className="absolute -left-2 bottom-40 z-20 animate-float text-xl text-primary [animation-delay:1.5s]" aria-hidden="true">
              ✦
            </span>

            <JustIn products={latest} paused={reduced || holding} />
          </div>
        </div>
      </div>
    </section>
  )
}
