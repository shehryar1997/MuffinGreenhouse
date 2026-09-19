import { Category, Event, JournalPost } from "@/types"

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
    description: "Browse our complete collection of locally grown plants.",
    tagline: "Everything we have in stock.",
  },
}


export const mockEvents: Event[] = [
  { id: "evt-001", slug: "repotting-workshop-spring-ready", title: "Repotting Workshop: Spring Ready", description: "Learn the art of repotting your plants for spring growth. Bring your own plant or use one of ours. We'll cover soil mixes, pot sizing, and root health.", type: "workshop", datetime: "2024-10-15T14:00:00Z", location: "Nursery Pickup Point, DHA Phase 6", price: 500, spotsTotal: 15, spotsRemaining: 8, image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&q=80", isUpcoming: true },
  { id: "evt-002", slug: "free-plant-walk-karachi", title: "Free Plant Walk: Karachi's Urban Greenery", description: "Join us for a guided tour of Karachi's hidden green spaces. Discover native and ornamental plants thriving in our city climate. Perfect for plant enthusiasts of all levels.", type: "tour", datetime: "2024-10-20T08:00:00Z", location: "Frere Hall Gardens", price: 0, spotsTotal: 25, spotsRemaining: 12, image: "https://images.unsplash.com/photo-1466692476864-a5c4f23df6f0?w=800&q=80", isUpcoming: true },
  { id: "evt-003", slug: "plant-parents-101", title: "Plant Parents 101", description: "Everything you need to know about caring for your first plants. We cover watering, light, soil, and common mistakes new plant parents make.", type: "workshop", datetime: "2024-09-01T10:00:00Z", location: "Muffin Nursery", price: 1500, spotsTotal: 12, spotsRemaining: 0, image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80", isUpcoming: false },
]
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

export const mockJournalPosts: JournalPost[] = [
  { id: "j1", slug: "monstera-care", title: "How to Care for Your Monstera", excerpt: "Everything you need.", content: "...", author: "Aisha", coverImage: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&q=80", tags: ["care"], publishedAt: "2024-01-10T00:00:00Z" },
]



// Event data access functions
export const getEventBySlug = (slug: string): Event | undefined => mockEvents.find((e) => e.slug === slug)
export const getUpcomingEvents = (): Event[] => mockEvents.filter((e) => e.isUpcoming)
export const getPastEvents = (): Event[] => mockEvents.filter((e) => !e.isUpcoming)
