// Muffin Nursery — Navigation Configuration
// Single source of truth for header, footer, mega-menu, and mobile nav

import { NavItem, MegaMenuSection } from "@/types"

export const siteConfig = {
  name: "Muffin",
  tagline: "Good plants. Good energy.",
  description: "A plant nursery for Karachi, Pakistan. Locally grown plants for real homes, with honest care advice.",
  url: "https://muffin.pk",
  whatsappNumber: "+923001234567",
  email: "hello@muffin.pk",
  address: {
    street: "Plot 12-C, Lane 5, Block 7",
    area: "Clifton",
    city: "Karachi",
    postalCode: "75600",
  },
  social: {
    instagram: "https://instagram.com/muffin.pk",
    facebook: "https://facebook.com/muffin.pk",
  },
}

// Shop by Need categories — reused across mega-menu and other sections
export const shopByNeedCategories: NavItem[] = [
  { id: "need-low-light", label: "Low-Light Survivors", href: "/shop-by-need/low-light-survivors" },
  { id: "need-balcony", label: "Balcony & Rooftop", href: "/shop-by-need/balcony-rooftop" },
  { id: "need-air", label: "Air-Purifying", href: "/shop-by-need/air-purifying" },
  { id: "need-pet", label: "Pet-Safe", href: "/shop-by-need/pet-safe" },
  { id: "need-beginner", label: "Beginner-Proof", href: "/shop-by-need/beginner-proof", featured: true },
  { id: "need-statement", label: "Statement Plants", href: "/shop-by-need/statement-plants" },
]

// Mega-menu sections for the Shop navigation item
export const shopMegaMenuSections: MegaMenuSection[] = [
  {
    id: "plants",
    title: "Plants",
    items: [
      { id: "shop-all", label: "All Plants", href: "/shop/all" },
      { id: "shop-aroids", label: "Aroids", href: "/shop/aroids", featured: true },
      { id: "shop-sansevierias", label: "Sansevierias", href: "/shop/sansevierias" },
      { id: "shop-agaves", label: "Agaves", href: "/shop/agaves" },
      { id: "shop-mangaves", label: "Mangaves", href: "/shop/mangaves" },
      { id: "shop-hoyas", label: "Hoyas", href: "/shop/hoyas", featured: true },
      { id: "shop-orchids", label: "Orchids", href: "/shop/orchids" },
    ],
  },
  {
    id: "tools-equipment",
    title: "Tools & Equipment",
    items: [
      { id: "shop-planting-media", label: "Planting Media", href: "/shop/planting-media" },
      { id: "shop-fertilizer", label: "Fertilizer", href: "/shop/fertilizer" },
      { id: "shop-pots", label: "Pots", href: "/shop/pots" },
      { id: "shop-other-equipment", label: "Other Equipment", href: "/shop/other-equipment" },
    ],
  },
  {
    id: "shop-by-need",
    title: "Shop by Need",
    items: shopByNeedCategories,
  },
]

export const mainNav: NavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
  },
  {
    id: "shop",
    label: "Shop",
    href: "/shop/all",
    hasMegaMenu: true,
  },
  {
    id: "muffin",
    label: "MUFFIN AI",
    href: "/muffin",
    isAi: true,
  },
  {
    id: "events",
    label: "Events",
    href: "/events",
  },
  {
    id: "journal",
    label: "Journal",
    href: "/journal",
  },
]

export const footerNav = {
  shop: [
    { id: "footer-aroids", label: "Aroids", href: "/shop/aroids" },
    { id: "footer-sansevierias", label: "Sansevierias", href: "/shop/sansevierias" },
    { id: "footer-agaves", label: "Agaves", href: "/shop/agaves" },
    { id: "footer-mangaves", label: "Mangaves", href: "/shop/mangaves" },
    { id: "footer-hoyas", label: "Hoyas", href: "/shop/hoyas" },
    { id: "footer-orchids", label: "Orchids", href: "/shop/orchids" },
    { id: "footer-planting-media", label: "Planting Media", href: "/shop/planting-media" },
    { id: "footer-fertilizer", label: "Fertilizer", href: "/shop/fertilizer" },
    { id: "footer-pots", label: "Pots", href: "/shop/pots" },
    { id: "footer-other-equipment", label: "Other Equipment", href: "/shop/other-equipment" },
  ],
  help: [
    { id: "footer-faq", label: "FAQ", href: "/faq" },
    { id: "footer-delivery", label: "Delivery & Pickup", href: "/delivery-and-pickup" },
    { id: "footer-guarantee", label: "Our Guarantee", href: "/our-guarantee" },
    { id: "footer-contact", label: "Contact Us", href: "/contact" },
  ],
  company: [
    { id: "footer-story", label: "Our Story", href: "/our-story" },
    { id: "footer-visit", label: "Visit Us", href: "/visit-us" },
    { id: "footer-events", label: "Events & Workshops", href: "/events" },
    { id: "footer-reviews", label: "Reviews", href: "/reviews" },
  ],
}

export const mobileNav: NavItem[] = [
  { id: "mobile-home", label: "Home", href: "/" },
  { id: "mobile-shop", label: "Shop All", href: "/shop/all" },
  { id: "mobile-plants", label: "Plants", href: "/shop", children: shopMegaMenuSections.find(s => s.id === "plants")?.items },
  { id: "mobile-tools", label: "Tools & Equipment", href: "/shop", children: shopMegaMenuSections.find(s => s.id === "tools-equipment")?.items },
  { id: "mobile-by-need", label: "By Need", href: "/shop-by-need", children: shopByNeedCategories },
  { id: "mobile-muffin", label: "MUFFIN AI", href: "/muffin", isAi: true },
  { id: "mobile-events", label: "Events", href: "/events" },
  { id: "mobile-journal", label: "Journal", href: "/journal" },
]
