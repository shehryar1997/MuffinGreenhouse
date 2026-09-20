import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Check, MessageCircle, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { callHref, whatsappHref, type Service } from "@/lib/services"

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

// One tint per service so the three read as a set. Theme tokens only, so they flip in dark mode.
// (Classes live here, not in lib/services.ts, because Tailwind does not scan lib/.)
export const accents: Record<string, { card: string; chip: string; tile: string }> = {
  landscaping: {
    card: "bg-forest-50 border-forest-200",
    chip: "bg-forest-100 text-forest-700",
    tile: "bg-forest-50 border-forest-200",
  },
  "garden-maintenance": {
    card: "bg-sprout-100 border-sprout-200",
    chip: "bg-sprout-200 text-sprout-800",
    tile: "bg-sprout-100 border-sprout-200",
  },
  "expert-visit": {
    card: "bg-primary/10 border-primary/25",
    chip: "bg-primary text-primary-foreground",
    tile: "bg-primary/10 border-primary/25",
  },
}

export function accentFor(slug: string) {
  return accents[slug] ?? accents.landscaping
}

export function WhatsAppButton({ message, label = "Chat on WhatsApp", className }: { message: string; label?: string; className?: string }) {
  return (
    <Button asChild size="lg" className={`min-h-[44px] px-5 ${className ?? ""}`}>
      <a href={whatsappHref(message)} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
        {label}
      </a>
    </Button>
  )
}

export function CallButton({ label = "Call now", className }: { label?: string; className?: string }) {
  return (
    <Button asChild size="lg" variant="outline" className={`min-h-[44px] px-5 ${className ?? ""}`}>
      <a href={callHref}>
        <Phone className="mr-2 h-4 w-4" aria-hidden />
        {label}
      </a>
    </Button>
  )
}

// Compact row (thumbnail left) on phones so all three services show quickly; tall image card from sm up.
export function ServiceCard({ service, priority = false }: { service: Service; priority?: boolean }) {
  const Icon = service.icon
  const accent = accentFor(service.slug)
  return (
    <Link
      href={`/services/${service.slug}`}
      className={`group flex overflow-hidden rounded-2xl border shadow-sm motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 hover:shadow-md motion-safe:hover:-translate-y-1 sm:flex-col ${accent.card} ${focusRing}`}
    >
      <div className="relative min-h-[148px] w-28 shrink-0 overflow-hidden sm:aspect-[16/10] sm:min-h-0 sm:w-full">
        <Image
          src={service.image.src}
          alt={service.image.alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 112px"
          className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent.chip}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <h3 className="font-serif text-lg leading-tight text-foreground sm:text-xl">{service.name}</h3>
        </div>
        <p className="mb-3 line-clamp-3 text-sm text-muted-foreground sm:line-clamp-none">{service.summary}</p>
        <ul className="mb-4 hidden space-y-1.5 text-sm text-foreground sm:block">
          {service.includes.slice(0, 3).map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <span className="mt-auto inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-foreground underline-offset-4 group-hover:underline sm:min-h-0 sm:pt-1">
          View service
          <ArrowRight className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
          <span className="sr-only">: {service.name}</span>
        </span>
      </div>
    </Link>
  )
}

export function CtaBand({ title, body, message }: { title: string; body: string; message: string }) {
  return (
    <section
      aria-labelledby="cta-band-title"
      className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-muted px-6 py-8 text-center md:flex-row md:justify-between md:text-left"
    >
      <div className="max-w-xl">
        <h2 id="cta-band-title" className="mb-1 font-serif text-xl text-foreground sm:text-2xl">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">{body}</p>
      </div>
      <div className="grid w-full shrink-0 grid-cols-2 gap-3 md:w-auto">
        <WhatsAppButton message={message} label="WhatsApp us" />
        <CallButton label="Call" />
      </div>
    </section>
  )
}

// Mobile only. The page adds bottom padding so this never covers content.
export function StickyCtaBar({ message }: { message: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
        <WhatsAppButton message={message} label="WhatsApp" className="w-full" />
        <CallButton label="Call" className="w-full" />
      </div>
    </div>
  )
}
