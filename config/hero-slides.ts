// Homepage hero carousel slides. The eyebrow above the headline ("A different kind of plant shop") is
// part of the hero frame, not a per-slide field, so it isn't listed here.

import { CalendarDays, ClipboardCheck, MapPin, MessageCircle, Package, ShieldCheck, Sprout, Truck, Users, type LucideIcon } from "lucide-react"

export interface HeroHighlight {
  icon: LucideIcon
  text: string
}

export interface HeroSlide {
  id: string
  image: string
  alt: string
  /** Two lines: the first in the foreground colour, the second in the primary colour with the underline. */
  headline: readonly [string, string]
  subcopy: string
  ctaLabel: string
  ctaHref: string
  /** Only the first slide carries a secondary button. */
  secondaryCta?: { label: string; href: string }
  /** CSS object-position, tuned per image so the subject survives the portrait arch crop. */
  objectPosition: string
  /** The three short facts under the buttons. Keep them true for what the slide is about (they are not shared across slides). */
  highlights: readonly HeroHighlight[]
}

export const HERO_SLIDES: readonly HeroSlide[] = [
  {
    id: "plants",
    image: "/hero/plants.avif",
    alt: "A greenhouse aisle filled with monsteras, anthuriums and snake plants",
    headline: ["Good plants.", "Good energy."],
    subcopy: "Green things worth collecting, sourced from around the world and acclimated for Pakistan.",
    ctaLabel: "Shop plants",
    ctaHref: "/shop/all",
    secondaryCta: { label: "Find your plant", href: "/plant-finder" },
    objectPosition: "52% 50%",
    highlights: [
      { icon: Truck, text: "Delivered across Pakistan" },
      { icon: ShieldCheck, text: "2-hour damage cover" },
      { icon: MessageCircle, text: "Free pickup, arranged on WhatsApp" },
    ],
  },
  {
    id: "tools-equipment",
    image: "/hero/pots.avif",
    alt: "Pots, planting media, fertilizer and gardening tools laid out on a greenhouse bench",
    headline: ["Roots love", "nice things."],
    subcopy: "Pots, potting mix, fertilizer and tools to help every plant settle in, grow and show off.",
    ctaLabel: "Shop all your Gardening Needs",
    ctaHref: "/shop/tools-equipment",
    objectPosition: "77% 60%",
    highlights: [
      { icon: Package, text: "Pots, soil mixes, fertilizer and tools" },
      { icon: Truck, text: "Delivered across Pakistan" },
      { icon: MessageCircle, text: "Free pickup, arranged on WhatsApp" },
    ],
  },
  {
    id: "services",
    image: "/hero/landscape.avif",
    alt: "A gardening team landscaping and tending the garden of a modern home",
    headline: ["Garden goals,", "handled."],
    subcopy: "Landscaping, garden maintenance and expert visit consultations, so your outdoor space can look leafy and loved.",
    ctaLabel: "Explore our Services",
    ctaHref: "/services",
    objectPosition: "80% 50%",
    highlights: [
      { icon: MapPin, text: "Serving Karachi" },
      { icon: ClipboardCheck, text: "Quote after an in-person visit" },
      { icon: MessageCircle, text: "Message or call to get started" },
    ],
  },
  {
    id: "events",
    image: "/hero/events.avif",
    alt: "Friends and families repotting plants together at a greenhouse workshop",
    headline: ["Dirty hands,", "happy hearts."],
    subcopy: "Join a workshop or event to repot, learn something new and meet fellow plant lovers.",
    ctaLabel: "Explore Upcoming Events",
    ctaHref: "/events",
    objectPosition: "42% 50%",
    highlights: [
      { icon: Users, text: "Small groups" },
      { icon: Sprout, text: "Real plants, hands in the soil" },
      { icon: CalendarDays, text: "Limited spots per event" },
    ],
  },
]
