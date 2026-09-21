"use client"

import { Globe, MessageCircle, ShieldCheck, Truck } from "lucide-react"
import { FadeIn } from "@/components/home/shared/animations"

// Only things the shop actually promises (see the delivery, guarantee and pickup pages).
const items = [
  { icon: Globe, title: "Sourced globally", text: "Propagated in Karachi and acclimated for Pakistan's heat." },
  { icon: Truck, title: "Delivered across Pakistan", text: "Packed carefully so plants arrive the way they left." },
  { icon: ShieldCheck, title: "2-hour damage cover", text: "Send photos within 2 hours for a replacement or store credit." },
  { icon: MessageCircle, title: "Real people on WhatsApp", text: "Care advice long after purchase, and free pickup." },
]

export function TrustStrip() {
  return (
    <section className="border-b border-border/60 bg-background">
      <div className="container mx-auto px-6 py-8 lg:px-12 lg:py-10">
        <ul className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <li key={item.title}>
              <FadeIn delay={i * 0.08}>
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sprout-100 text-sprout-700 ring-1 ring-forest-200/60">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-serif text-lg leading-tight text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              </FadeIn>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
