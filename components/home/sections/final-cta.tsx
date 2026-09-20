"use client"

import Image from "next/image"
import Link from "next/link"
import { FadeIn } from "@/components/home/shared/animations"
import { WhatsAppIcon } from "@/components/ui/whatsapp-button"
import { askMuffin, siteConfig } from "@/config/nav.config"

const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Hi Muffin! I have a question about your plants.")}`

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-clay-500 py-20 text-white lg:py-28">
      <span className="pointer-events-none absolute left-[8%] top-10 animate-float text-4xl text-sprout-300/80" aria-hidden="true">
        ✦
      </span>
      <span className="pointer-events-none absolute bottom-10 right-[10%] animate-float text-5xl text-white/30 [animation-delay:2s]" aria-hidden="true">
        ✦
      </span>
      <div className="container relative mx-auto px-6 text-center lg:px-12">
        <FadeIn>
          <p className="font-mono text-xs uppercase tracking-widest text-white/80">Still deciding?</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-serif text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-tight">Send us a photo of your space.</h2>
          <p className="mx-auto mt-6 max-w-md text-lg text-white/85">We&apos;ll tell you what would actually thrive there. Real people, real advice, no pressure.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-[#25D366] px-7 py-3.5 font-mono text-xs font-semibold uppercase tracking-widest text-ink shadow-lg transition hover:-translate-y-0.5 hover:brightness-105"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Message us on WhatsApp
            </a>
            <Link
              href="/muffin"
              className="inline-flex items-center gap-2.5 rounded-full bg-paper py-2 pl-2.5 pr-6 font-mono text-xs font-semibold uppercase tracking-widest text-ink shadow-lg transition hover:-translate-y-0.5"
            >
              <Image src={askMuffin.logo} alt="" width={askMuffin.logoWidth} height={askMuffin.logoHeight} className="h-9 w-auto" />
              {askMuffin.name}
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
