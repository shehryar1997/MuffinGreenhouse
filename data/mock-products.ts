import { Product, Review, Category, Event, JournalPost } from "@/types"

// ===== ALL CATEGORIES =====
export const categories: Record<string, Category> = {
  // Plant categories
  aroids: { id: "cat-1", slug: "aroids", name: "Aroids", sortOrder: 1, isActive: true },
  sansevierias: { id: "cat-2", slug: "sansevierias", name: "Sansevierias", sortOrder: 2, isActive: true },
  agaves: { id: "cat-3", slug: "agaves", name: "Agaves", sortOrder: 3, isActive: true },
  mangaves: { id: "cat-4", slug: "mangaves", name: "Mangaves", sortOrder: 4, isActive: true },
  hoyas: { id: "cat-5", slug: "hoyas", name: "Hoyas", sortOrder: 5, isActive: true },
  orchids: { id: "cat-6", slug: "orchids", name: "Orchids", sortOrder: 6, isActive: true },
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
    description: "From Monstera to Philodendron — dramatic foliage plants with stunning leaf shapes.",
    tagline: "Bold leaves, stunning silhouettes.",
  },
  sansevierias: {
    title: "Sansevierias",
    description: "Snake plants and relatives — architectural, drought-tolerant, and nearly indestructible.",
    tagline: "Architectural beauty that survives anything.",
  },
  agaves: {
    title: "Agaves",
    description: "Bold succulents with dramatic spiky leaves — perfect for sunny spots.",
    tagline: "Desert drama for your space.",
  },
  mangaves: {
    title: "Mangaves",
    description: "Agave hybrids with softer edges and faster growth — the best of both worlds.",
    tagline: "Hybrid vigor, striking forms.",
  },
  hoyas: {
    title: "Hoyas",
    description: "Wax plants — trailing vines with thick, waxy leaves and star-shaped flowers.",
    tagline: "Trailing stars in bloom.",
  },
  orchids: {
    title: "Orchids",
    description: "Exquisite blooms that bring tropical elegance to any room.",
    tagline: "Elegance in every petal.",
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

// ponytail: Distribute mood tags across plants for variety instead of all "bright"
const createPlant = (id: string, name: string, slug: string, cat: Category, price: number, stock: number, stockStatus: Product["stockStatus"], imageUrl: string, extraTags: string[] = [], extraProps: Partial<Product> = {}): Product => {
  // Distribute mood tags based on plant characteristics for realistic variety
  // Aroids and orchids -> soft (elegant, flowing)
  // Agaves, snake plants -> moody (structural, dramatic)  
  // Hoyas, succulents -> bright (cheerful, rounded)
  const defaultMoodTag: "soft" | "bright" | "moody" = 
    cat.slug === "aroids" || cat.slug === "orchids" ? "soft" :
    cat.slug === "sansevierias" || cat.slug === "agaves" ? "moody" :
    "bright"
  
  return { 
    id, name, slug, category: cat, description: `${name} — locally grown in Karachi`, price, currency: "PKR", stockStatus, stockCount: stock, images: [{ id: `img-${id}`, url: imageUrl, alt: name, sortOrder: 1 }], careInfo: { light: "Bright indirect", water: "Weekly", humidity: "Average", temperature: "20-30°C", soil: "Well-draining", fertilizer: "Monthly", toxicity: "Check label" }, variants: [{ id: `var-${id}`, name: "Standard", price, stockStatus, stockCount: stock, sku: slug.substring(0, 3).toUpperCase() + "001" }], useCaseTags: ["beginner", ...extraTags], isNewArrival: id.includes("-new"), isPetSafe: id.includes("-safe"), difficulty: "beginner", lightRequirement: "medium", waterRequirement: "medium", size: "medium", moodTags: extraProps.moodTags ?? [defaultMoodTag], createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-09-01T00:00:00Z", ...extraProps 
  }
}

const createTool = (id: string, name: string, slug: string, cat: Category, price: number, stock: number, stockStatus: Product["stockStatus"], imageUrl: string): Product => ({ id, name, slug, category: cat, description: `${name} — essential for plant care`, price, currency: "PKR", stockStatus, stockCount: stock, images: [{ id: `img-${id}`, url: imageUrl, alt: name, sortOrder: 1 }], careInfo: { light: "N/A", water: "N/A", humidity: "N/A", temperature: "N/A", soil: "N/A", fertilizer: "N/A", toxicity: "Non-toxic" }, variants: [{ id: `var-${id}`, name: "Default", price, stockStatus, stockCount: stock, sku: slug.substring(0, 3).toUpperCase() + "001" }], useCaseTags: [], isNewArrival: false, isPetSafe: true, difficulty: "beginner", lightRequirement: "low", waterRequirement: "low", size: "small", moodTags: [], createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-09-01T00:00:00Z" })

// === AROIDS ===
const aroids = [
  createPlant("prod-001", "Monstera Deliciosa", "monstera-deliciosa", categories.aroids, 2500, 8, "in_stock", "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&q=80"),
  createPlant("prod-aroid-002", "Pink Princess Philodendron", "pink-princess-philodendron", categories.aroids, 8500, 3, "low_stock", "https://images.unsplash.com/photo-1628506471177-2832323c5e81?w=800&q=80", ["statement"]),
  createPlant("prod-aroid-003", "Philodendron Brasil", "philodendron-brasil", categories.aroids, 1800, 12, "in_stock", "https://images.unsplash.com/photo-1600417148561-5b3e7a19de18?w=800&q=80", ["beginner"]),
  createPlant("prod-aroid-004", "Anthurium Red", "anthurium-red", categories.aroids, 3200, 6, "in_stock", "https://images.unsplash.com/photo-1593691509543-c55ba2c66769?w=800&q=80", ["air-purifying"]),
  createPlant("prod-aroid-005", "Alocasia Polly", "alocasia-polly", categories.aroids, 3800, 4, "low_stock", "https://images.unsplash.com/photo-1612363228248-93c30113d8e1?w=800&q=80"),
  createPlant("prod-aroid-006", "ZZ Plant", "zz-plant", categories.aroids, 2800, 15, "in_stock", "https://images.unsplash.com/photo-1631197721633-254365f354d9?w=800&q=80", ["low-light", "air-purifying"], { lightRequirement: "low" }),
  createPlant("prod-aroid-007", "Pothos Golden", "pothos-golden", categories.aroids, 1200, 20, "in_stock", "https://images.unsplash.com/photo-1600417148561-5b3e7a19de18?w=800&q=80", ["beginner", "trailing"]),
  createPlant("prod-aroid-008", "Syngonium Pink", "syngonium-pink", categories.aroids, 1800, 10, "in_stock", "https://images.unsplash.com/photo-1600417148561-5b3e7a19de18?w=800&q=80"),
]

// === SANSEVIERIAS ===
const sansevierias = [
  createPlant("prod-003", "Snake Plant", "snake-plant", categories.sansevierias, 1800, 25, "in_stock", "https://images.unsplash.com/photo-1599598425947-240a7d7c5b1d?w=800&q=80", ["low-light", "air-purifying"], { lightRequirement: "low" }),
  createPlant("prod-sans-002", "Laurentii Snake Plant", "laurentii-snake-plant", categories.sansevierias, 2200, 12, "in_stock", "https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=800&q=80", ["statement"]),
  createPlant("prod-sans-003", "Cylindrical Snake Plant", "cylindrical-snake-plant", categories.sansevierias, 2600, 8, "in_stock", "https://images.unsplash.com/photo-1599598425947-240a7d7c5b1d?w=800&q=80"),
  createPlant("prod-sans-004", "Whale Fin Sansevieria", "whale-fin-sansevieria", categories.sansevierias, 4800, 3, "low_stock", "https://images.unsplash.com/photo-1599598425947-240a7d7c5b1d?w=800&q=80", ["rare"]),
]

// === AGAVES ===
const agaves = [
  createPlant("prod-agave-001", "Blue Agave", "blue-agave", categories.agaves, 4500, 6, "in_stock", "https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=800&q=80", ["statement"], { lightRequirement: "full_sun", size: "large" }),
  createPlant("prod-agave-002", "Century Plant", "century-plant", categories.agaves, 5800, 3, "low_stock", "https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=800&q=80", ["statement"], { lightRequirement: "full_sun" }),
]

// === MANGAVES ===
const mangaves = [
  createPlant("prod-mangave-001", "Mangave Silver Fox", "mangave-silver-fox", categories.mangaves, 3800, 5, "in_stock", "https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=800&q=80"),
  createPlant("prod-mangave-002", "Mangave Macho Mocha", "mangave-macho-mocha", categories.mangaves, 4200, 4, "in_stock", "https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=800&q=80", ["statement"]),
]

// === HOYAS ===
const hoyas = [
  createPlant("prod-002", "Hoya Kerrii", "hoya-kerrii", categories.hoyas, 1200, 15, "in_stock", "https://images.unsplash.com/photo-1459411552884-8419b9b3cc2a?w=800&q=80", ["beginner", "pet-safe"], { isPetSafe: true }),
  createPlant("prod-hoyas-002", "Hoya Carnosa", "hoya-carnosa", categories.hoyas, 1800, 10, "in_stock", "https://images.unsplash.com/photo-1459411552884-8419b9b3cc2a?w=800&q=80", ["pet-safe", "trailing"], { isPetSafe: true }),
]

// === ORCHIDS ===
const orchids = [
  createPlant("prod-orchid-001", "Phalaenopsis Orchid", "phalaenopsis-orchid", categories.orchids, 3500, 8, "in_stock", "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=800&q=80", ["elegant", "statement"]),
  createPlant("prod-orchid-002", "Dendrobium Orchid", "dendrobium-orchid", categories.orchids, 4200, 5, "in_stock", "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=800&q=80", ["elegant"]),
]

// === TOOLS & EQUIPMENT ===
// Planting Media
const plantingMedia = [
  createTool("tool-soil-001", "Premium Potting Mix (5L)", "premium-potting-mix", categories["planting-media"], 800, 50, "in_stock", "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&q=80"),
  createTool("tool-soil-002", "Coco Coir Brick", "coco-coir-brick", categories["planting-media"], 450, 40, "in_stock", "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&q=80"),
  createTool("tool-soil-003", "Perlite (2L)", "perlite-2l", categories["planting-media"], 350, 60, "in_stock", "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&q=80"),
  createTool("tool-soil-004", "Orchid Bark Mix", "orchid-bark-mix", categories["planting-media"], 550, 35, "in_stock", "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&q=80"),
  createTool("tool-soil-005", "Vermiculite (1L)", "vermiculite-1l", categories["planting-media"], 280, 45, "in_stock", "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&q=80"),
]

// Fertilizer
const fertilizers = [
  createTool("tool-fert-001", "Liquid Fertilizer (250ml)", "liquid-fertilizer", categories.fertilizer, 650, 30, "in_stock", "https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=800&q=80"),
  createTool("tool-fert-002", "Slow-Release Pellets", "slow-release-pellets", categories.fertilizer, 480, 45, "in_stock", "https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=800&q=80"),
  createTool("tool-fert-003", "Organic Seaweed Fertilizer", "seaweed-fertilizer", categories.fertilizer, 780, 20, "in_stock", "https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=800&q=80"),
  createTool("tool-fert-004", "Orchid Food Spray", "orchid-food-spray", categories.fertilizer, 520, 40, "in_stock", "https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=800&q=80"),
]

// Pots
const pots = [
  createTool("tool-pot-001", "Terracotta Pot 6in", "terracotta-pot-6", categories.pots, 450, 100, "in_stock", "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80"),
  createTool("tool-pot-002", "Ceramic Pot 8in", "ceramic-pot-8", categories.pots, 1200, 40, "in_stock", "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80"),
  createTool("tool-pot-003", "White Ceramic Pot Set", "white-ceramic-pot-set", categories.pots, 2500, 25, "in_stock", "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80"),
  createTool("tool-pot-004", "Self-Watering Pot", "self-watering-pot", categories.pots, 1800, 30, "in_stock", "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80"),
  createTool("tool-pot-005", "Decorative Basket Planter", "basket-planter", categories.pots, 950, 50, "in_stock", "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80"),
]

// Other Equipment
const otherEquipment = [
  createTool("tool-misc-001", "Plant Mister", "plant-mister", categories["other-equipment"], 650, 40, "in_stock", "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80"),
  createTool("tool-misc-002", "Pruning Shears", "pruning-shears", categories["other-equipment"], 950, 30, "in_stock", "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80"),
  createTool("tool-misc-003", "Humidity Tray", "humidity-tray", categories["other-equipment"], 750, 35, "in_stock", "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80"),
  createTool("tool-misc-004", "Plant Support Stake", "plant-support-stake", categories["other-equipment"], 350, 60, "in_stock", "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80"),
  createTool("tool-misc-005", "Moisture Meter", "moisture-meter", categories["other-equipment"], 1200, 20, "in_stock", "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80"),
]

export const mockProducts: Product[] = [
  ...aroids, ...sansevierias, ...agaves, ...mangaves, 
  ...hoyas, ...orchids, ...plantingMedia, ...fertilizers, 
  ...pots, ...otherEquipment
]

export const mockReviews: Review[] = [
  { id: "rev-001", productId: "prod-001", customerName: "Aisha K.", rating: 5, text: "My monstera arrived healthy!", verifiedPurchase: true, createdAt: "2024-08-15T00:00:00Z" },
  { id: "rev-002", productId: "prod-003", customerName: "Omar R.", rating: 5, text: "Survived my forgetfulness.", verifiedPurchase: true, createdAt: "2024-07-20T00:00:00Z" },
]

export const mockEvents: Event[] = [
  { id: "evt-001", slug: "repotting-workshop-spring-ready", title: "Repotting Workshop: Spring Ready", description: "Learn the art of repotting your plants for spring growth. Bring your own plant or use one of ours. We'll cover soil mixes, pot sizing, and root health.", type: "workshop", datetime: "2024-10-15T14:00:00Z", location: "Nursery Pickup Point, DHA Phase 6", price: 500, spotsTotal: 15, spotsRemaining: 8, image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&q=80", isUpcoming: true },
  { id: "evt-002", slug: "free-plant-walk-karachi", title: "Free Plant Walk: Karachi's Urban Greenery", description: "Join us for a guided tour of Karachi's hidden green spaces. Discover native and ornamental plants thriving in our city climate. Perfect for plant enthusiasts of all levels.", type: "tour", datetime: "2024-10-20T08:00:00Z", location: "Frere Hall Gardens", price: 0, spotsTotal: 25, spotsRemaining: 12, image: "https://images.unsplash.com/photo-1466692476864-a5c4f23df6f0?w=800&q=80", isUpcoming: true },
  { id: "evt-003", slug: "plant-parents-101", title: "Plant Parents 101", description: "Everything you need to know about caring for your first plants. We cover watering, light, soil, and common mistakes new plant parents make.", type: "workshop", datetime: "2024-09-01T10:00:00Z", location: "Muffin Nursery", price: 1500, spotsTotal: 12, spotsRemaining: 0, image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80", isUpcoming: false },
]
export const useCases: Record<string, { title: string; desc: string; icon: string }> = {
  "low-light-survivors": { title: "Low-light Survivors", desc: "Thrive where the sun doesn't shine", icon: "🌙" },
  "pet-safe": { title: "Pet-Safe", desc: "Non-toxic for curious cats and dogs", icon: "🐾" },
  "beginner-proof": { title: "Beginner-Proof", desc: "Hard to kill, easy to love", icon: "💚" },
  "statement-plants": { title: "Statement Plants", desc: "Big, bold, and conversation-starting", icon: "✨" },
  "air-purifying": { title: "Air-purifying", desc: "NASA-approved fresh air", icon: "💨" },
  "balcony-rooftop": { title: "Balcony & Rooftop", desc: "Wind and heat warriors", icon: "🏠" },
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


export const getProductBySlug = (slug: string): Product | undefined => mockProducts.find((p) => p.slug === slug)
export const getProductsByCategory = (categorySlug: string): Product[] => mockProducts.filter((p) => p.category.slug === categorySlug)
export const getWeeklySoldCount = (): number => 14
export const plantOfTheDay = mockProducts[0]

// Event data access functions
export const getEventBySlug = (slug: string): Event | undefined => mockEvents.find((e) => e.slug === slug)
export const getUpcomingEvents = (): Event[] => mockEvents.filter((e) => e.isUpcoming)
export const getPastEvents = (): Event[] => mockEvents.filter((e) => !e.isUpcoming)
