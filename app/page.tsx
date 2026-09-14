"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Plus } from "lucide-react"
import { mockProducts, useCases } from "@/data/mock-products"

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay }}>
    {children}
  </motion.div>
)

const placeholderProducts = [
  { bg: "bg-[#D4F542]", name: "Money Plant (Pothos)", stars: "4.8" },
  { bg: "bg-[#F5E6D3]", name: "Monstera Deliciosa", note: "ONLY 2 LEFT", stars: "4.9" },
  { bg: "bg-[#E85A3C]", name: "Snake Plant", stars: "4.9" },
  { bg: "bg-[#7EC8E3]", name: "Areca Palm", soldOut: true, stars: "4.7" }
]

const useCasesList = [
  { key: "low-light-survivors", title: "Low-Light Survivors", accent: false },
  { key: "balcony-rooftop", title: "Balcony & Rooftop", accent: true },
  { key: "air-purifying", title: "Air-Purifying", accent: false },
  { key: "pet-safe", title: "Pet-Safe", accent: false },
  { key: "beginner-proof", title: "Beginner-Proof", accent: false },
  { key: "statement-plants", title: "Statement Plants", accent: false }
]

export default function HomePage() {
  const [selectedMood, setSelectedMood] = useState("soft")
  useEffect(() => {}, [])

  return (
    <div className="bg-[#FAF7F2]">
      {/* Hero */}
      <section className="min-h-screen">
        <div className="container mx-auto px-6 lg:px-12 pt-8 pb-20">
          <div className="flex justify-end mb-8">
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.8, type: "spring" }} className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-[#D4F542] flex items-center justify-center">
              <span className="font-mono text-xs">M / G</span>
            </motion.div>
          </div>

          <FadeIn>
            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono text-xs text-[#E85A3C]">001</span>
              <span className="w-8 h-px bg-forest-300"></span>
              <span className="font-mono text-xs tracking-widest text-forest-600">A DIFFERENT KIND OF PLANT SHOP</span>
            </div>
          </FadeIn>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn delay={0.1}>
              <div>
                <h1 className="font-serif leading-[0.85] tracking-tight">
                  <span className="block text-[clamp(3rem,12vw,8rem)] text-[#1A1A1A]">Good</span>
                  <span className="block text-[clamp(3rem,12vw,8rem)] text-[#1A1A1A]">plants.</span>
                  <span className="block text-[clamp(3rem,12vw,8rem)] text-[#E85A3C]">Good</span>
                  <span className="block text-[clamp(3rem,12vw,8rem)] text-[#E85A3C]">energy.</span>
                </h1>
                <div className="mt-8 flex items-start gap-4">
                  <p className="text-forest-600 text-lg max-w-xs">Green things for people who want their spaces to feel more alive. Curated in Karachi, delivered with care.</p>
                  <div className="rotate-90"><ArrowRight className="w-5 h-5 text-[#E85A3C]" /></div>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="relative">
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-full border-[12px] border-[#FAF7F2]" style={{ borderBottom: 'none' }}>
                  <Image src="https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&q=80" alt="Monstera plant" fill className="object-cover" priority />
                  <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#D4F542]" />
                </div>
                <div className="absolute -right-4 bottom-20 text-xs font-mono tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>N 25 ARC</div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section className="bg-[#1A1A1A] py-5 overflow-hidden">
        <motion.div className="flex whitespace-nowrap" animate={{ x: ['0%', '-50%'] }} transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-12 px-12">
              <span className="text-white font-medium text-sm tracking-wide">Home-grown and loved</span>
              <span className="text-[#D4F542] text-lg">&#10022;</span>
              <span className="text-white font-medium text-sm tracking-wide">Plants for real homes</span>
              <span className="text-[#D4F542] text-lg">&#10022;</span>
              <span className="text-white font-medium text-sm tracking-wide">Honest care advice</span>
              <span className="text-[#D4F542] text-lg">&#10022;</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Section 002 */}
      <section className="py-24 lg:py-32 bg-[#FAF7F2]">
        <div className="container mx-auto px-6 lg:px-12">
          <FadeIn>
            <div className="mb-16">
              <span className="font-mono text-xs text-forest-500">002</span>
              <span className="mx-3 text-forest-300">/</span>
              <span className="font-mono text-xs tracking-widest text-forest-600">OUR METHOD</span>
            </div>
          </FadeIn>
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <FadeIn delay={0.1}>
              <h2 className="font-serif leading-[0.9] tracking-tight">
                <span className="block text-[clamp(2.5rem,8vw,5.5rem)] text-[#1A1A1A]">Less guesswork.</span>
                <span className="block text-[clamp(2.5rem,8vw,5.5rem)] text-[#E85A3C]">More green.</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="lg:pt-4">
                <p className="text-forest-600 text-lg mb-8 max-w-sm">Tell us about your space, and we will point you toward something that will actually thrive there.</p>
                <Link href="/plant-finder" className="inline-flex items-center gap-3 font-mono text-xs tracking-widest uppercase border-b border-forest-300 pb-2 hover:text-[#E85A3C] hover:border-[#E85A3C] transition-colors group">
                  Find Your Match
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Three Steps */}
      <section className="py-16 border-t border-forest-200/50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-12">
            {[{num:"01",title:"Choose your light",desc:"Sun, shade, or somewhere in between"},{num:"02",title:"Meet your plant",desc:"We match you with a green companion"},{num:"03",title:"Keep it alive",desc:"Simple care, honest advice, zero guilt"}].map((step,i)=> (
              <FadeIn key={i} delay={i*0.1}>
                <div className="border-t border-forest-300 pt-6">
                  <span className="font-mono text-xs text-[#E85A3C]">{step.num}</span>
                  <h3 className="font-serif text-xl mt-4 mb-2">{step.title}</h3>
                  <p className="text-forest-500 text-sm">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Section 003 - Dark Atmosphere */}
      <section className="py-24 lg:py-32 bg-[#1A1A1A]">
        <div className="container mx-auto px-6 lg:px-12">
          <FadeIn>
            <div className="mb-16">
              <span className="font-mono text-xs text-forest-400">003</span>
              <span className="mx-3 text-forest-600">/</span>
              <span className="font-mono text-xs tracking-widest text-forest-400">THE COLLECTION</span>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="font-serif leading-[0.9] tracking-tight mb-16">
              <span className="block text-[clamp(2.5rem,8vw,5.5rem)] text-white">Pick your</span>
              <span className="block text-[clamp(2.5rem,8vw,5.5rem)] text-[#E85A3C]">atmosphere.</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-forest-400 text-sm mb-8">Not every plant belongs in every room.</p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="flex items-center gap-3 mb-12 flex-wrap">
              <span className="font-mono text-xs text-forest-500 uppercase mr-4">My room feels</span>
              {["soft","bright","moody"].map((m) => (
                <button key={m} onClick={() => setSelectedMood(m)} className={`px-5 py-2 rounded-full text-xs font-medium tracking-wide border transition-all duration-300 ${selectedMood === m ? 'bg-[#D4F542] text-[#1A1A1A] border-[#D4F542]' : 'bg-transparent text-white border-forest-600 hover:border-[#D4F542]'}`}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={0.4}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {placeholderProducts.map((p, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className={`relative aspect-[3/4] overflow-hidden ${p.bg}`}>
                    <span className="absolute top-3 left-3 font-mono text-xs text-[#1A1A1A]">{String(i+1).padStart(2,'0')}</span>
                  </div>
                  <div className="mt-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-forest-500 text-xs mb-1">
                        {p.soldOut ? <span className="text-forest-400">SOLD OUT</span> : <><span>&#9733; {p.stars}</span>{p.note && <span className="text-[#E85A3C]">{p.note}</span>}</>}
                      </div>
                      <h3 className="font-serif text-lg text-white group-hover:text-[#D4F542] transition-colors">{p.name}</h3>
                    </div>
                    <button className="w-8 h-8 rounded-full border border-forest-600 flex items-center justify-center hover:bg-[#D4F542] hover:border-[#D4F542] hover:text-[#1A1A1A] transition-colors text-white">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Section 004 - Shop by Need */}
      <section className="py-24 lg:py-32 bg-[#FAF7F2]">
        <div className="container mx-auto px-6 lg:px-12">
          <FadeIn>
            <div className="mb-16">
              <span className="font-mono text-xs text-forest-500">004</span>
              <span className="mx-3 text-forest-300">/</span>
              <span className="font-mono text-xs tracking-widest text-forest-600">SHOP BY NEED</span>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="font-serif text-[clamp(2rem,6vw,4rem)] text-[#1A1A1A] leading-[0.95] tracking-tight mb-16">
              Find your kind of green.
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {useCasesList.map((uc) => (
                <Link key={uc.key} href={`/shop-by-need/${uc.key}`} className={`group p-8 border border-forest-200/50 hover:border-[#D4F542] transition-colors relative overflow-hidden ${uc.accent ? 'bg-[#E8F5A8]' : 'bg-transparent hover:bg-white'}`}>
                  <span className="text-[#E85A3C] text-2xl absolute top-6 right-6">*</span>
                  <h3 className="font-serif text-2xl mb-2">{uc.title}</h3>
                  <p className="font-mono text-[10px] tracking-widest text-forest-500 uppercase">Curated for real homes</p>
                </Link>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>


      {/* Section 005 - Our Story */}
      <section className="py-24 lg:py-32 bg-[#FAF7F2] border-t border-forest-200/50">
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
                <span className="block text-[clamp(2rem,6vw,4rem)] text-[#1A1A1A]">We killed a lot of plants</span>
                <span className="block text-[clamp(2rem,6vw,4rem)] text-[#1A1A1A]">so you do not have to.</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="lg:pt-16">
                <p className="text-forest-600 text-lg mb-8 max-w-sm">We stock only what we know thrives in Karachi heat, dust, and occasional neglect.</p>
                <Link href="/our-story" className="inline-flex items-center gap-3 font-mono text-xs tracking-widest uppercase border-b border-forest-300 pb-2 hover:text-[#E85A3C] hover:border-[#E85A3C] transition-colors group">
                  Read Our Story
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>


      {/* Section 006 - Events */}
      <section className="py-16 lg:py-20 bg-[#D4F542]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16">
            <FadeIn>
              <div>
                <span className="font-mono text-xs text-[#1A1A1A]/60">006</span>
                <span className="mx-2 text-[#1A1A1A]/30">/</span>
                <span className="font-mono text-xs tracking-widest text-[#1A1A1A]/60">IN THE GREENHOUSE</span>
                <h2 className="font-serif text-[clamp(2.5rem,6vw,5rem)] text-[#1A1A1A] leading-[0.9] tracking-tight mt-8">
                  Get your<br />hands dirty.
                </h2>
                <p className="text-[#1A1A1A]/70 mt-6 max-w-xs">Workshops, plant walks, and small rituals for curious people.</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="space-y-8">
                <div className="border-b border-[#1A1A1A]/20 pb-8">
                  <span className="font-mono text-xs text-[#E85A3C]">RS. 500</span>
                  <h3 className="font-serif text-xl mt-2 text-[#1A1A1A]">Repotting Workshop: Spring Ready</h3>
                  <p className="font-mono text-[10px] text-[#1A1A1A]/60 tracking-widest mt-2 uppercase">Nursery Pickup Point, DHA Phase 6</p>
                </div>
                <div className="border-b border-[#1A1A1A]/20 pb-8">
                  <span className="font-mono text-xs text-[#E85A3C]">FREE</span>
                  <h3 className="font-serif text-xl mt-2 text-[#1A1A1A]">Free Plant Walk: Karachi&apos;s Urban Greenery</h3>
                  <p className="font-mono text-[10px] text-[#1A1A1A]/60 tracking-widest mt-2 uppercase">Frere Hall Gardens</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Section 006 CTA */}
      <section className="py-12 bg-[#D4F542]">
        <div className="container mx-auto px-6 lg:px-12">
          <Link href="/events" className="flex items-center justify-between border-t border-[#1A1A1A]/20 pt-8 group">
            <span className="font-mono text-xs tracking-widest text-[#1A1A1A]">VIEW ALL EVENTS</span>
            <ArrowRight className="w-4 h-4 text-[#1A1A1A] group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>

    </div>
  )
}
