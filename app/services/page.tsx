import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SERVICE_CITY, generalWhatsappMessage, getService, services } from "@/lib/services"
import { CallButton, CtaBand, ServiceCard, WhatsAppButton } from "./_components/service-ui"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: `Garden & Plant Services in ${SERVICE_CITY}`,
  description: `Landscaping, garden maintenance and expert plant visits in ${SERVICE_CITY}. Tell us about your space and we will take it from there.`,
  path: "/services",
})

const steps = [
  { title: "Message us", description: "Tell us about your space and what you need." },
  { title: "We visit and quote", description: "We see it in person and send you a quote." },
  { title: "We get to work", description: "We start once you are happy with the plan." },
]

export default function ServicesPage() {
  const expertVisit = getService("expert-visit")

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:pt-28">
        {/* Kept short on purpose: the three services should be on screen without scrolling. */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h1 className="mb-2 font-serif text-3xl leading-tight text-foreground sm:text-4xl">Garden help, from people who grow plants</h1>
            <p className="text-muted-foreground">
              Design, care and honest advice for gardens, balconies and plant collections in {SERVICE_CITY}.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-3">
            <WhatsAppButton message={generalWhatsappMessage} label="WhatsApp us" />
            <CallButton label="Call" />
          </div>
        </header>

        <section aria-labelledby="our-services" className="mb-10">
          <h2 id="our-services" className="sr-only">
            Our services
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {services.map((service, i) => (
              <ServiceCard key={service.slug} service={service} priority={i < 2} />
            ))}
          </div>
        </section>

        <section aria-labelledby="how-it-works" className="mb-6 rounded-2xl border border-border bg-muted/50 p-5 sm:p-6">
          <h2 id="how-it-works" className="mb-4 font-serif text-xl text-foreground sm:text-2xl">
            How it works
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="flex items-start gap-3">
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

        {expertVisit && (
          <section
            aria-labelledby="not-sure"
            className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <div className="max-w-xl">
              <h2 id="not-sure" className="mb-1 font-serif text-lg text-foreground sm:text-xl">
                Not sure which one?
              </h2>
              <p className="text-sm text-muted-foreground">
                Start with an Expert Visit. We look at your space and plants, then tell you what would help most.
              </p>
            </div>
            <Button asChild variant="outline" className="min-h-[44px] shrink-0">
              <Link href={`/services/${expertVisit.slug}`}>
                About the Expert Visit
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </section>
        )}

        <CtaBand
          title="Tell us about your space"
          body="A short message is enough to start. Photos help, but you do not need them."
          message={generalWhatsappMessage}
        />
      </div>
    </div>
  )
}
