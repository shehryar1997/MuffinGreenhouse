// Muffin Nursery — Navigation Configuration
// Single source of truth for header, footer, mega-menu, and mobile nav

import { NavItem } from "@/types"

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

export const mainNav: NavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
  },
  {
    id: "shop",
    label: "Shop",
    href: "/shop",
    children: [
      { id: "shop-all", label: "All Plants", href: "/shop/all" },
      { id: "shop-aroids", label: "Aroids", href: "/shop/aroids", featured: true },
      { id: "shop-sansevierias", label: "Sansevierias", href: "/shop/sansevierias" },
      { id: "shop-agave", label: "Agave", href: "/shop/agave" },
      { id: "shop-mangave", label: "Mangave", href: "/shop/mangave" },
      { id: "shop-adenium", label: "Adenium", href: "/shop/adenium" },
      { id: "shop-hoya", label: "Hoya", href: "/shop/hoya", featured: true },
      { id: "shop-orchids", label: "Orchids", href: "/shop/orchids" },
      { id: "shop-cacti", label: "Cacti & Succulents", href: "/shop/cacti-succulents" },
    ],
  },
  {
    id: "shop-by-need",
    label: "By Need",
    href: "/shop-by-need",
    children: [
      { id: "need-low-light", label: "Low Light Survivors", href: "/shop-by-need/low-light-survivors" },
      { id: "need-balcony", label: "Balcony & Rooftop", href: "/shop-by-need/balcony-rooftop" },
      { id: "need-air", label: "Air Purifying", href: "/shop-by-need/air-purifying" },
      { id: "need-pet", label: "Pet Safe", href: "/shop-by-need/pet-safe" },
      { id: "need-beginner", label: "Beginner Proof", href: "/shop-by-need/beginner-proof", featured: true },
      { id: "need-statement", label: "Statement Plants", href: "/shop-by-need/statement-plants" },
    ],
  },
  {
    id: "plant-finder",
    label: "Plant Finder",
    href: "/plant-finder",
    featured: true,
  },
  {
    id: "muffin",
    label: "Muffin",
    href: "/muffin",
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
    { id: "footer-hoya", label: "Hoya", href: "/shop/hoya" },
    { id: "footer-cacti", label: "Cacti", href: "/shop/cacti-succulents" },
    { id: "footer-orchids", label: "Orchids", href: "/shop/orchids" },
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
  { id: "mobile-plants", label: "Plants", href: "/shop", children: mainNav.find(n => n.id === "shop")?.children },
  { id: "mobile-by-need", label: "By Need", href: "/shop-by-need", children: mainNav.find(n => n.id === "shop-by-need")?.children },
  { id: "mobile-finder", label: "Plant Finder", href: "/plant-finder" },
  { id: "mobile-muffin", label: "Muffin", href: "/muffin" },
  { id: "mobile-journal", label: "Journal", href: "/journal" },
  { id: "mobile-events", label: "Events", href: "/events" },
]
