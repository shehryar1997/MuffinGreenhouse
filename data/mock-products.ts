import { Category } from "@/types"

// ===== ALL CATEGORIES =====
export const categories: Record<string, Category> = {
  // Plant categories
  aroids: { id: "cat-1", slug: "aroids", name: "Aroids", sortOrder: 1, isActive: true },
  sansevierias: { id: "cat-2", slug: "sansevierias", name: "Sansevierias", sortOrder: 2, isActive: true },
  agaves: { id: "cat-3", slug: "agaves", name: "Agaves", sortOrder: 3, isActive: true },
  mangaves: { id: "cat-4", slug: "mangaves", name: "Mangaves", sortOrder: 4, isActive: true },
  hoyas: { id: "cat-5", slug: "hoyas", name: "Hoyas", sortOrder: 5, isActive: true },
  orchids: { id: "cat-6", slug: "orchids", name: "Orchids", sortOrder: 6, isActive: true },
  "cacti-succulents": { id: "cat-7", slug: "cacti-succulents", name: "Cacti & Succulents", sortOrder: 7, isActive: true },
  all: { id: "cat-0", slug: "all", name: "All Plants", sortOrder: 0, isActive: true },
  // Tools & Equipment
  "planting-media": { id: "cat-10", slug: "planting-media", name: "Planting Media", sortOrder: 10, isActive: true },
  fertilizer: { id: "cat-11", slug: "fertilizer", name: "Fertilizer", sortOrder: 11, isActive: true },
  pots: { id: "cat-12", slug: "pots", name: "Pots", sortOrder: 12, isActive: true },
  "other-equipment": { id: "cat-13", slug: "other-equipment", name: "Other Equipment", sortOrder: 13, isActive: true },
}

// Category metadata for display
export const categoryMeta: Record<string, { title: string; description: string; tagline: string }> = {
  aroids: {
    title: "Aroids",
    description: "From Monstera to Philodendron. Dramatic foliage plants with stunning leaf shapes.",
    tagline: "Bold leaves, stunning silhouettes.",
  },
  sansevierias: {
    title: "Sansevierias",
    description: "Snake plants and relatives. Architectural, drought-tolerant, and nearly indestructible.",
    tagline: "Architectural beauty that survives anything.",
  },
  agaves: {
    title: "Agaves",
    description: "Bold succulents with dramatic spiky leaves. Perfect for sunny spots.",
    tagline: "Desert drama for your space.",
  },
  mangaves: {
    title: "Mangaves",
    description: "Agave hybrids with softer edges and faster growth. The best of both worlds.",
    tagline: "Hybrid vigor, striking forms.",
  },
  hoyas: {
    title: "Hoyas",
    description: "Wax plants. Trailing vines with thick, waxy leaves and star-shaped flowers.",
    tagline: "Trailing stars in bloom.",
  },
  orchids: {
    title: "Orchids",
    description: "Exquisite blooms that bring tropical elegance to any room.",
    tagline: "Elegance in every petal.",
  },
  "cacti-succulents": {
    title: "Cacti & Succulents",
    description: "Sun-loving cacti and succulents that store their own water. Compact, sculptural and easy to care for.",
    tagline: "Tough, tiny, and full of character.",
  },
  "planting-media": {
    title: "Planting Media",
    description: "Premium soils, coco coir, perlite, and custom mixes for every plant type.",
    tagline: "The foundation of healthy plants.",
  },
  fertilizer: {
    title: "Fertilizer",
    description: "Liquid feeds, slow-release pellets, and organic options to help your plants thrive.",
    tagline: "Nourishment for growth.",
  },
  pots: {
    title: "Pots",
    description: "Ceramic, terracotta, and decorative planters in all shapes and sizes.",
    tagline: "Find the perfect home.",
  },
  "other-equipment": {
    title: "Other Equipment",
    description: "Misters, pruners, humidity trays, and everything else a plant parent needs.",
    tagline: "Tools for every task.",
  },
  all: {
    title: "All Plants",
    description: "Browse our complete collection of plants.",
    tagline: "Everything we have in stock.",
  },
}


export const useCases: Record<string, { title: string; desc: string; icon: string }> = {
  "low-light-survivors": { title: "Low-Light Survivors", desc: "Thrive where the sun doesn't shine", icon: "🌙" },
  "balcony-rooftop": { title: "Balcony & Rooftop", desc: "Wind and heat warriors", icon: "🏠" },
  "air-purifying": { title: "Air-Purifying", desc: "Research-backed fresh air", icon: "💨" },
  "pet-safe": { title: "Pet-Safe", desc: "Non-toxic for curious cats and dogs", icon: "🐾" },
  "beginner-proof": { title: "Beginner-Proof", desc: "Hard to kill, easy to love", icon: "💚" },
  "statement-plants": { title: "Statement Plants", desc: "Big, bold, and conversation-starting", icon: "✨" },
}

// Icons for Shop by Need categories - matches the slugs in nav.config.ts
export const shopByNeedIcons: Record<string, string> = {
  "low-light-survivors": "🌙",
  "pet-safe": "🐾",
  "beginner-proof": "💚",
  "statement-plants": "✨",
  "air-purifying": "💨",
  "balcony-rooftop": "🏠",
}
