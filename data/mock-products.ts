import { Product, Review, Category, Event } from "@/types"

const categories: Record<string, Category> = {
  aroids: { id: "cat-1", slug: "aroids", name: "Aroids", sortOrder: 1, isActive: true },
  sansevierias: { id: "cat-2", slug: "sansevierias", name: "Sansevierias", sortOrder: 2, isActive: true },
  hoya: { id: "cat-3", slug: "hoya", name: "Hoya", sortOrder: 6, isActive: true },
  cacti: { id: "cat-4", slug: "cacti-succulents", name: "Cacti & Succulents", sortOrder: 8, isActive: true },
}

const createProduct = (id: string, name: string, slug: string, cat: Category, price: number, stock: number, stockStatus: Product["stockStatus"]): Product => ({
  id, name, slug, category: cat, description: `${name} — locally grown in Karachi`, price, currency: "PKR", stockStatus, stockCount: stock,
  images: [{ id: `img-${id}`, url: `https://images.unsplash.com/photo-${name === "Monstera" ? "1614594975525-e45190c55d0b" : name === "Snake Plant" ? "1599598425947-240a7d7c5b1d" : "1459411552884-841db9b3cc2a"}?w=800&q=80`, alt: name, sortOrder: 1 }],
  careInfo: { light: "Bright indirect", water: "Weekly", humidity: "Average", temperature: "20-30°C", soil: "Well-draining", fertilizer: "Monthly", toxicity: "Check label" },
  variants: [{ id: `var-${id}`, name: "Standard", price, stockStatus, stockCount: stock, sku: slug.substring(0, 3).toUpperCase() }],
  useCaseTags: ["beginner"], isNewArrival: id === "prod-002", isPetSafe: id === "prod-002", difficulty: "beginner", lightRequirement: "medium", waterRequirement: "medium", size: "medium", moodTags: ["bright"], createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-09-01T00:00:00Z"
})

export const mockProducts: Product[] = [
  createProduct("prod-001", "Monstera Deliciosa", "monstera-deliciosa", categories.aroids, 2500, 8, "in_stock"),
  createProduct("prod-002", "Hoya Kerrii", "hoya-kerrii", categories.hoya, 1200, 15, "in_stock"),
  createProduct("prod-003", "Snake Plant", "snake-plant", categories.sansevierias, 1800, 25, "in_stock"),
  createProduct("prod-004", "String of Pearls", "string-of-pearls", categories.cacti, 1500, 2, "low_stock"),
  createProduct("prod-005", "ZZ Plant", "zz-plant", categories.aroids, 2800, 12, "in_stock"),
  { ...createProduct("prod-006", "Pink Princess", "pink-princess", categories.aroids, 8500, 0, "out_of_stock"), variants: [{ id: "v-006", name: "Established", price: 8500, stockStatus: "out_of_stock", stockCount: 0, sku: "PPP" }] },
]

export const mockReviews: Review[] = [
  { id: "rev-001", productId: "prod-001", customerName: "Aisha K.", rating: 5, text: "My monstera arrived healthy!", verifiedPurchase: true, createdAt: "2024-08-15T00:00:00Z" },
  { id: "rev-002", productId: "prod-003", customerName: "Omar R.", rating: 5, text: "Survived my forgetfulness.", verifiedPurchase: true, createdAt: "2024-07-20T00:00:00Z" },
]

export const mockEvents: Event[] = [
  { id: "evt-001", slug: "plant-parents-101", title: "Plant Parents 101", description: "Everything you need to know.", type: "workshop", datetime: "2024-10-15T14:00:00Z", location: "Muffin Nursery", price: 1500, spotsTotal: 12, spotsRemaining: 4, image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&q=80", isUpcoming: true },
]
export const useCases: Record<string, { title: string; desc: string; icon: string }> = {
  "low-light-survivors": { title: "Low-light Survivors", desc: "Thrive where the sun doesn't shine", icon: "🌙" },
  "pet-safe": { title: "Pet-Safe", desc: "Non-toxic for curious cats and dogs", icon: "🐾" },
  "beginner-proof": { title: "Beginner-Proof", desc: "Hard to kill, easy to love", icon: "💚" },
  "statement-plants": { title: "Statement Plants", desc: "Big, bold, and conversation-starting", icon: "✨" },
  "air-purifying": { title: "Air-purifying", desc: "NASA-approved fresh air", icon: "💨" },
  "balcony-rooftop": { title: "Balcony & Rooftop", desc: "Wind and heat warriors", icon: "🏠" },
}

export const mockJournalPosts: JournalPost[] = [
  { id: "j1", slug: "monstera-care", title: "How to Care for Your Monstera", excerpt: "Everything you need.", content: "...", author: "Aisha", coverImage: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&q=80", tags: ["care"], publishedAt: "2024-01-10T00:00:00Z" },
]


export const getProductBySlug = (slug: string): Product | undefined => mockProducts.find((p) => p.slug === slug)
export const getProductsByCategory = (categorySlug: string): Product[] => mockProducts.filter((p) => p.category.slug === categorySlug)
export const getWeeklySoldCount = (): number => 14
export const plantOfTheDay = mockProducts[0]
