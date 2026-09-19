"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useParallax } from "@/hooks/use-parallax"
import { Product } from "@/types"

// ponytail: Lazy-load below-the-fold sections to improve initial page load
// LightFilterTeaser is client-only (uses useState), so ssr: false
const LightFilterTeaser = dynamic(
  () => import("@/components/light-filter-teaser").then((mod) => ({ default: mod.LightFilterTeaser })),
  { ssr: false }
)

// Content sections below-the-fold: SSR-enabled with loading fallback for SEO visibility
// Using dynamic imports without ssr: false so content remains server-rendered for SEO
const AtmospherePicker = dynamic(
  () => import("./sections/atmosphere-picker").then((mod) => ({ default: mod.AtmospherePicker })),
  { loading: () => <SectionSkeleton /> }
)

const ShopByNeedSection = dynamic(
  () => import("./sections/shop-by-need-section").then((mod) => ({ default: mod.ShopByNeedSection })),
  { loading: () => <SectionSkeleton /> }
)

const OurStorySection = dynamic(
  () => import("./sections/our-story-section").then((mod) => ({ default: mod.OurStorySection })),
  { loading: () => <SectionSkeleton /> }
)

const EventsSection = dynamic(
  () => import("./sections/events-section").then((mod) => ({ default: mod.EventsSection })),
  { loading: () => <SectionSkeleton /> }
)

// Simple loading skeleton for lazy-loaded sections
// ponytail: Lightweight CSS-based skeleton, no JS overhead
function SectionSkeleton() {
  return (
    <div className="py-16 lg:py-20 animate-pulse">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="h-8 bg-forest-100 rounded w-1/4 mb-8" />
        <div className="h-64 bg-forest-100 rounded" />
      </div>
    </div>
  )
}

// ponytail: `immediate` is for the hero. Framer's initial={{ opacity: 0 }} is server-rendered as opacity:0, so the
// whole above-the-fold area stayed blank until JavaScript loaded and hydrated (first paint ~2.2 s on the audit run).
// A CSS animation starts on first paint and needs no JavaScript. Reduced-motion users get static content either way.
const immediateStyle = (delay: number): React.CSSProperties => ({ animationDelay: `${delay}s`, animationFillMode: "both" })

const FadeIn = ({ children, delay = 0, immediate = false }: { children: React.ReactNode; delay?: number; immediate?: boolean }) => {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div>{children}</div>
  }

  if (immediate) {
    return <div className="animate-fade-in-up" style={immediateStyle(delay)}>{children}</div>
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay }}>
      {children}
    </motion.div>
  )
}

// Kinetic type animation: container wrapper that triggers viewport detection
// Respects prefers-reduced-motion - falls back to static rendering
function KineticHeading({ children, delay = 0, immediate = false }: { children: React.ReactNode; delay?: number; immediate?: boolean }) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div>{children}</div>
  }

  if (immediate) {
    return <div className="animate-fade-in-up" style={immediateStyle(delay)}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  )
}

// Individual word/line animation with stagger support
// Each line animates independently with subtle fade + vertical slide
function KineticLine({ children, className = "", delay = 0, immediate = false }: { children: React.ReactNode; className?: string; delay?: number; immediate?: boolean }) {
  const prefersReducedMotion = useReducedMotion()

  // ponytail: If reduced motion preferred, render plain span without animation
  if (prefersReducedMotion) {
    return <span className={className}>{children}</span>
  }

  if (immediate) {
    return <span className={`block animate-fade-in-up ${className}`} style={immediateStyle(delay)}>{children}</span>
  }

  return (
    <motion.span
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.35, // snappy: under 400ms per element
        delay, // 60-100ms offset between lines, configurable per instance
        ease: [0.25, 0.46, 0.45, 0.94], // ease-out style curve
      }}
      className={`block ${className}`}
    >
      {children}
    </motion.span>
  )
}

// LiftText: Premium letter stagger lift effect
// Each letter subtly rises on hover with staggered timing - refined yet playful
// ponytail: Fine-grained letter animation requires splitting text, but worth it for the effect
function LiftText({ children, className = "" }: { children: string; className?: string }) {
  const prefersReducedMotion = useReducedMotion()
  const [isHovered, setIsHovered] = useState(false)

  if (prefersReducedMotion) {
    return <span className={className}>{children}</span>
  }

  const letters = children.split("")

  return (
    <span
      className={`inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          className="inline-block"
          animate={isHovered ? { y: -3 } : { y: 0 }}
          transition={{
            duration: 0.25,
            delay: index * 0.02, // 20ms stagger per letter
            ease: [0.22, 1, 0.36, 1], // Premium ease-out
          }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </span>
  )
}

// AnimatedHeading: Unified microinteraction for headlines
// Applies KineticLine entrance + LiftText hover to each line
// ponytail: Single source of truth for heading microinteractions
interface AnimatedHeadingProps {
  /** Array of text lines - each renders as separate block with entrance animation */
  lines: string[]
  /**
   * Base className applied to each line wrapper.
   * Can be a string (applied to all lines) or array of strings (one per line).
   */
  className?: string | string[]
  /** Stagger delay between lines (in seconds), default: 0.08 */
  stagger?: number
  /** Initial delay before first line animates (in seconds), default: 0 */
  delay?: number
  /** Above-the-fold: animate with CSS on first paint instead of waiting for hydration */
  immediate?: boolean
}

function AnimatedHeading({ lines, className = "", stagger = 0.08, delay = 0, immediate = false }: AnimatedHeadingProps) {
  const prefersReducedMotion = useReducedMotion()

  // ponytail: Handle per-line or shared className
  const getLineClass = (index: number): string => {
    if (Array.isArray(className)) {
      return className[index] || className[className.length - 1] || ""
    }
    return className
  }

  // ponytail: Reduced motion fallback - render static text
  if (prefersReducedMotion) {
    return (
      <>
        {lines.map((line, i) => (
          <span key={i} className={`block ${getLineClass(i)}`}>
            {line}
          </span>
        ))}
      </>
    )
  }

  return (
    <>
      {lines.map((line, i) => (
        <KineticLine key={i} className={getLineClass(i)} delay={delay + i * stagger} immediate={immediate}>
          <LiftText>{line}</LiftText>
        </KineticLine>
      ))}
    </>
  )
}



// Component with cursor-reactive parallax effect on the Monstera image
// Disabled on touch devices and when prefers-reduced-motion is set
function ParallaxMonstera() {
  const { offset, containerRef } = useParallax({ maxOffset: 8 })
  const prefersReducedMotion = useReducedMotion()

  // If reduced motion is preferred, render static version
  if (prefersReducedMotion) {
    return (
      <FadeIn delay={0.2}>
        <div className="relative">
          <div className="relative aspect-[3/4] overflow-hidden rounded-t-full border-[12px] border-background" style={{ borderBottom: 'none' }}>
            <Image src="https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&q=80" alt="Monstera plant" fill className="object-cover" priority />
            <div className="absolute bottom-0 left-0 right-0 h-3 bg-secondary" />
          </div>
        </div>
      </FadeIn>
    )
  }

  return (
    <FadeIn delay={0.2} immediate>
      <div ref={containerRef as React.RefObject<HTMLDivElement>} className="relative">
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-t-full border-[12px] border-background"
          style={{ borderBottom: 'none' }}
        >
          <div
            className="absolute inset-[-16px]"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px)`,
              transition: 'transform 50ms ease-out',
            }}
          >
            <Image
              src="https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&q=80"
              alt="Monstera plant"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-secondary z-10" />
        </div>
      </div>
    </FadeIn>
  )
}

function AnimatedBadge({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  if (prefersReducedMotion) {
    return (
      <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-secondary flex items-center justify-center">
        <span className="font-mono text-xs text-secondary-foreground">M / G</span>
      </div>
    )
  }

  return (
    <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.8, type: "spring" }} className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-secondary flex items-center justify-center">
      <span className="font-mono text-xs text-secondary-foreground">M / G</span>
    </motion.div>
  )
}

export default function HomeContent({ products }: { products: Product[] }) {
  const prefersReducedMotion = useReducedMotion()
  useEffect(() => {}, [])

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="min-h-screen">
        {/* pt-24/28 clears the fixed header (it used to overlap the badge and first line on phones) */}
        <div className="container mx-auto px-6 lg:px-12 pt-24 lg:pt-28 pb-20">
          <div className="flex justify-end mb-8">
            <AnimatedBadge prefersReducedMotion={prefersReducedMotion} />
          </div>

          <FadeIn immediate>
            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono text-xs text-primary">001</span>
              <span className="w-8 h-px bg-border"></span>
              <span className="font-mono text-xs tracking-widest text-muted-foreground">A DIFFERENT KIND OF PLANT SHOP</span>
            </div>
          </FadeIn>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <KineticHeading delay={0.1} immediate>
              <div>
                <h1 className="font-serif leading-[0.85] tracking-tight">
                  <AnimatedHeading
                    immediate
                    lines={["Good", "plants.", "Good", "energy."]}
                    className={[
                      "text-[clamp(3rem,12vw,8rem)] text-foreground",
                      "text-[clamp(3rem,12vw,8rem)] text-foreground",
                      "text-[clamp(3rem,12vw,8rem)] text-primary",
                      "text-[clamp(3rem,12vw,8rem)] text-primary",
                    ]}
                  />
                </h1>
                <div className="mt-8 flex items-start gap-4">
                  <p className="text-muted-foreground text-lg max-w-xs">Green things worth collecting - sourced globally, acclimated for<br />Pakistan.</p>
                  <div className="rotate-90"><ArrowRight className="w-5 h-5 text-primary" /></div>
                </div>
                {/* The hero had no call to action; the first real one was two screens down. */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/shop/all" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-mono text-xs uppercase tracking-widest text-primary-foreground transition hover:brightness-110">
                    Shop plants
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </Link>
                  <Link href="/plant-finder" className="inline-flex items-center gap-2 rounded-full border border-foreground/30 px-6 py-3 font-mono text-xs uppercase tracking-widest text-foreground transition hover:border-foreground">
                    Find your plant
                  </Link>
                </div>
              </div>
            </KineticHeading>

            <ParallaxMonstera />
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section className="bg-foreground py-5 overflow-hidden">
        {/* Reduced-motion visitors get a still strip: auto-moving text that can't be paused fails WCAG 2.2.2. */}
        <motion.div className="flex whitespace-nowrap" animate={prefersReducedMotion ? { x: 0 } : { x: ['0%', '-50%'] }} transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-12 px-12">
              <span className="text-background font-medium text-sm tracking-wide">Curated for the modern collector</span>
              <span className="text-secondary text-lg">&#10022;</span>
              <span className="text-background font-medium text-sm tracking-wide">Rare plants for one of a kind spaces</span>
              <span className="text-secondary text-lg">&#10022;</span>
              <span className="text-background font-medium text-sm tracking-wide">We are here for every leaf, long after purchase</span>
              <span className="text-secondary text-lg">&#10022;</span>
              <span className="text-background font-medium text-sm tracking-wide">Hand-picked before they ever reach you</span>
              <span className="text-secondary text-lg">&#10022;</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Section 002 */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <FadeIn>
            <div className="mb-16">
              <span className="font-mono text-xs text-forest-500">002</span>
              <span className="mx-3 text-forest-300">/</span>
              <span className="font-mono text-xs tracking-widest text-forest-600">OUR METHOD</span>
            </div>
          </FadeIn>
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <KineticHeading delay={0.1}>
              <h2 className="font-serif leading-[0.9] tracking-tight">
                <AnimatedHeading
                  lines={["Less", "guesswork.", "More", "green."]}
                  className={[
                    "text-[clamp(2.5rem,10vw,5rem)] text-foreground",
                    "text-[clamp(2.5rem,10vw,5rem)] text-foreground",
                    "text-[clamp(2.5rem,10vw,5rem)] text-sprout-400",
                    "text-[clamp(2.5rem,10vw,5rem)] text-sprout-400",
                  ]}
                />
              </h2>
            </KineticHeading>
            <FadeIn delay={0.2}>
              <div className="lg:pt-4">
                <p className="text-muted-foreground text-lg mb-8 max-w-sm">Tell us about your light, your space, your habits, and we&apos;ll match you with a plant built to thrive there.</p>
                <Link href="/plant-finder" className="inline-flex items-center gap-3 font-mono text-xs tracking-widest uppercase border-b border-border pb-2 hover:text-primary hover:border-primary transition-colors group">
                  Find Your Match
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Three Steps */}
      <section className="py-16 border-t border-border/50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-12">
            {[{num:"01",title:"Choose your light",desc:"Sun, shade, or somewhere in between. Tell us how your space lives."},{num:"02",title:"Meet your plant",desc:"Matched from our current rarities, not a generic list."},{num:"03",title:"Keep it alive",desc:"Considered care, from someone who stays with you after."}].map((step,i)=> (
              <FadeIn key={i} delay={i*0.1}>
                <div className="border-t border-border pt-6">
                  <span className="font-mono text-xs text-primary">{step.num}</span>
                  <h3 className="font-serif text-xl mt-4 mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Light Filter Teaser - positioned below the three-step row */}
          <LightFilterTeaser products={products} />
        </div>
      </section>

      {/* Section 003 - Atmosphere Picker (lazy-loaded) */}
      <AtmospherePicker products={products} />

      {/* Section 004 - Shop by Need (lazy-loaded) */}
      <ShopByNeedSection />


      {/* Section 005 - Our Story (lazy-loaded) */}
      <OurStorySection />


      {/* Section 006 - Events (lazy-loaded) */}
      <EventsSection />

    </div>
  )
}
