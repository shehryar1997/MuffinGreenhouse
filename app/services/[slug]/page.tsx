import type { Metadata } from "next"
import Link from "next/link"
import { SmartImage as Image } from "@/components/ui/smart-image"
import { notFound } from "next/navigation"
import { Check, ChevronDown } from "lucide-react"
import { siteConfig } from "@/config/nav.config"
import { SERVICE_CITY, getService, services } from "@/lib/services"
import { serializeJsonLd } from "@/lib/structured-data"
import { CallButton, CtaBand, ServiceCard, StickyCtaBar, WhatsAppButton, accentFor } from "../_components/service-ui"
import { pageMetadata } from "@/lib/seo"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = getService(slug)
  if (!service) return {}
  return pageMetadata({ title: service.metaTitle, description: service.metaDescription, path: `/services/${service.slug}` })
}

const sectionHeading = "mb-5 font-serif text-xl text-foreground sm:text-2xl"

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params
  const service = getService(slug)
  if (!service) notFound()

  const Icon = service.icon
  const accent = accentFor(service.slug)
  const others = services.filter((s) => s.slug !== service.slug)

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Services", item: `${siteConfig.url}/services` },
        { "@type": "ListItem", position: 3, name: service.name, item: `${siteConfig.url}/services/${service.slug}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.name,
      description: service.summary,
      url: `${siteConfig.url}/services/${service.slug}`,
      provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
      areaServed: { "@type": "City", name: SERVICE_CITY },
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      {/* Extra bottom padding on mobile keeps the sticky CTA bar off the content */}
      <div className="container mx-auto max-w-6xl px-4 pb-32 pt-24 sm:px-6 md:pb-16 lg:pt-28">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/services" className="underline-offset-4 hover:text-foreground hover:underline">
                Services
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-foreground">
              {service.name}
            </li>
          </ol>
        </nav>

        <header className="mb-12 grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border sm:aspect-[16/10] lg:order-2">
            <Image
              src={service.image.src}
              alt={service.image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="lg:order-1">
            <span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent.chip}`}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <h1 className="mb-2 font-serif text-3xl leading-tight text-foreground sm:text-4xl">{service.name}</h1>
            <p className="mb-2 text-lg text-foreground">{service.tagline}</p>
            <p className="mb-6 text-muted-foreground">{service.summary}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <WhatsAppButton message={service.whatsappMessage} />
              <CallButton />
            </div>
          </div>
        </header>

        <section aria-labelledby="included" className="mb-12">
          <h2 id="included" className={sectionHeading}>
            What&apos;s included
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {service.includes.map((item) => (
              <li key={item} className={`flex items-start gap-3 rounded-xl border p-4 ${accent.tile}`}>
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="steps" className="mb-12">
          <h2 id="steps" className={sectionHeading}>
            How it works
          </h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {service.steps.map((step, i) => (
              <li key={step.title} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm text-primary-foreground"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-medium text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="good-for" className="mb-12">
          <h2 id="good-for" className={sectionHeading}>
            Good for
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {service.goodFor.map((item) => (
              <li key={item} className="flex items-start gap-3 text-foreground">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="faqs" className="mb-12 max-w-3xl">
          <h2 id="faqs" className={sectionHeading}>
            Questions
          </h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {service.faqs.map((faq) => (
              <details key={faq.question} className="group px-5">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 rounded-md py-3 font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted-foreground motion-safe:transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="pb-4 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mb-12">
          <CtaBand
            title={`Ready to talk about ${service.shortName.toLowerCase()}?`}
            body="Send us a message. We reply on WhatsApp and take it from there."
            message={service.whatsappMessage}
          />
        </div>

        <section aria-labelledby="other-services">
          <h2 id="other-services" className={sectionHeading}>
            Other services
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
            {others.map((other) => (
              <ServiceCard key={other.slug} service={other} />
            ))}
          </div>
        </section>
      </div>

      <StickyCtaBar message={service.whatsappMessage} />
    </div>
  )
}
