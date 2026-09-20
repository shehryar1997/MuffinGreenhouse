import { ClipboardCheck, Sprout, Trees, type LucideIcon } from "lucide-react"
import { siteConfig } from "@/config/nav.config"

// The one place to change the service area.
export const SERVICE_CITY = "Karachi"

export type ServiceFaq = { question: string; answer: string }

export type Service = {
  slug: string
  name: string
  shortName: string
  tagline: string
  summary: string
  icon: LucideIcon
  image: { src: string; width: number; height: number; alt: string }
  includes: string[]
  steps: { title: string; description: string }[]
  goodFor: string[]
  faqs: ServiceFaq[]
  whatsappMessage: string
  metaTitle: string
  metaDescription: string
}

export const services: Service[] = [
  {
    slug: "landscaping",
    name: "Landscaping Services",
    shortName: "Landscaping",
    tagline: "Gardens, balconies and lawns that suit your space and your life.",
    summary: `We design and plant gardens, balconies and lawns in ${SERVICE_CITY}. The plants are picked for your light, your space and the time you have.`,
    icon: Trees,
    includes: [
      "A site visit to look at light, space and soil",
      "A planting plan for your garden, balcony or lawn",
      `Plants chosen to cope with ${SERVICE_CITY} heat and sun`,
      "Soil preparation and planting",
      "Beds, pots and lawn set up as agreed",
      "A simple care sheet for what comes next",
    ],
    steps: [
      { title: "Message us", description: "Tell us about your space and what you have in mind. Photos help." },
      { title: "We visit and quote", description: "We look at the space in person, talk it through with you and send a quote." },
      { title: "We plan and plant", description: "Once you are happy with the plan, we prepare the soil and put the plants in." },
      { title: "Handover", description: "We show you how it all works and leave a simple care sheet." },
    ],
    goodFor: [
      "New homes with bare outdoor space",
      "Balconies and rooftops that need some life",
      "Lawns that have given up",
      "Anyone who wants a garden without the guesswork",
    ],
    faqs: [
      {
        question: "Can you work with a small balcony?",
        answer: "Yes. Small spaces are some of our favourite jobs. A few well-chosen plants can change how a balcony feels.",
      },
      {
        question: "Can I choose the plants myself?",
        answer: "Of course. Tell us what you like and we will say what will do well in your light and how much care each one needs.",
      },
      {
        question: "How much does landscaping cost?",
        answer: "Quote on request. Every space is different, so we give you a quote after we have seen it.",
      },
      {
        question: "How long will the work take?",
        answer: "Timeline confirmed after a site visit. It depends on the size of the space and what we are planting.",
      },
    ],
    whatsappMessage: `Hi Muffin! I'd like to know more about your Landscaping Services in ${SERVICE_CITY}.`,
    metaTitle: `Landscaping Services in ${SERVICE_CITY}`,
    metaDescription: `Garden, balcony and lawn design and planting in ${SERVICE_CITY}. We visit your space, plan it with you and plant it. Quote on request.`,
    // TODO: swap for a real Muffin photo
    image: {
      src: "/images/services/landscaping-karachi.avif",
      width: 1600,
      height: 1000,
      alt: "Gardeners at work in a landscaped front garden: shaping a tree, mowing the lawn and planting flower beds",
    },
  },
  {
    slug: "garden-maintenance",
    name: "Garden Maintenance Services",
    shortName: "Garden Maintenance",
    tagline: "Regular visits so your garden stays healthy all year.",
    summary: "Recurring visits for watering, pruning, feeding and pest checks. We look after your plants, season by season.",
    icon: Sprout,
    includes: [
      "Watering checks and adjustments",
      "Pruning and tidying",
      "Feeding suited to each plant",
      "Pest and disease checks",
      "Care changes as the seasons turn",
      "Simple notes on what we noticed",
    ],
    steps: [
      { title: "Message us", description: "Tell us about your garden, balcony or plant collection." },
      { title: "We visit and quote", description: "We see what your plants need and send a quote for regular care." },
      { title: "We agree a rhythm", description: "Together we decide how often we should come." },
      { title: "We look after it", description: "We visit as agreed and keep your plants healthy." },
    ],
    goodFor: [
      "Busy households",
      "People who travel often",
      "Gardens that were planted and then forgotten",
      "Balconies and terraces full of potted plants",
    ],
    faqs: [
      {
        question: "How often will you visit?",
        answer: "We agree a rhythm with you after the first visit. It depends on the size of the garden and what is growing in it.",
      },
      {
        question: "Can you look after plants you did not supply?",
        answer: "Yes. We care for the plants you have, whoever they came from.",
      },
      {
        question: "Do I need to be home for visits?",
        answer: "Not always. We agree access with you beforehand, so it works around your day.",
      },
      {
        question: "How much does maintenance cost?",
        answer: "Quote on request. The price depends on the size of the garden and how often we visit.",
      },
    ],
    whatsappMessage: `Hi Muffin! I'd like to know more about your Garden Maintenance Services in ${SERVICE_CITY}.`,
    metaTitle: `Garden Maintenance Services in ${SERVICE_CITY}`,
    metaDescription: `Regular garden care in ${SERVICE_CITY}: watering, pruning, feeding, pest checks and seasonal care. Quote on request.`,
    // TODO: swap for a real Muffin photo
    image: {
      src: "/images/services/garden-maintenance-karachi.avif",
      width: 1600,
      height: 1000,
      alt: "Three gardeners pruning and tending planted beds beside a house, with shears, a watering can and a hose on hand",
    },
  },
  {
    slug: "expert-visit",
    name: "Expert Visit Consultation",
    shortName: "Expert Visit",
    tagline: "A plant person comes to you, looks around and leaves you a clear plan.",
    summary: "We visit your space, look at your plants and your light, and leave you a care plan and plant recommendations.",
    icon: ClipboardCheck,
    includes: [
      "A visit to your home, balcony or garden",
      "A look at light, airflow and space",
      "A check of your current plants for health and pests",
      "A clear care plan for what you already have",
      "Plant recommendations that suit the space",
      "Answers to your questions on the spot",
    ],
    steps: [
      { title: "Message us", description: "Tell us what is going on with your plants or your space." },
      { title: "We arrange a visit", description: "We agree a time that suits you and confirm the details." },
      { title: "We look and advise", description: "We go through your space and plants with you, one by one." },
      { title: "You get your plan", description: "You leave with a clear care plan and plant recommendations." },
    ],
    goodFor: [
      "Plants that are struggling and you are not sure why",
      "New plant parents who want a good start",
      "Anyone unsure what to plant in a particular space",
      "People deciding between landscaping and regular maintenance",
    ],
    faqs: [
      {
        question: "What do I get at the end of the visit?",
        answer: "A clear care plan for your plants and recommendations for what will suit your space.",
      },
      {
        question: "Do I have to buy plants from you afterwards?",
        answer: "No. The care plan is yours to use however you like. If you want plants from us, we are happy to help.",
      },
      {
        question: "How much does a visit cost?",
        answer: "Quote on request. Message us and we will share the details.",
      },
      {
        question: "How long does the visit take?",
        answer: "Timeline confirmed after we hear about your space. Bigger gardens and larger plant collections take longer.",
      },
    ],
    whatsappMessage: `Hi Muffin! I'd like to book an Expert Visit Consultation in ${SERVICE_CITY}.`,
    metaTitle: `Expert Plant Visit Consultation in ${SERVICE_CITY}`,
    metaDescription: `A plant person visits your home or garden in ${SERVICE_CITY}, looks at your plants and space, and leaves a clear care plan. Quote on request.`,
    // TODO: swap for a real Muffin photo
    image: {
      src: "/images/services/expert-visit-karachi.avif",
      width: 1600,
      height: 1000,
      alt: "Three people going over a garden plan on a clipboard and tablet on a lawn beside a house",
    },
  },
]

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug)
}

const whatsappDigits = siteConfig.whatsappNumber.replace(/\D/g, "")

export function whatsappHref(message: string): string {
  return `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`
}

export const callHref = `tel:${siteConfig.whatsappNumber}`

export const generalWhatsappMessage = `Hi Muffin! I'd like to know more about your services in ${SERVICE_CITY}.`
