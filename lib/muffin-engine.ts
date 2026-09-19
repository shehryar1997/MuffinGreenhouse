// ponytail: Shared rule-based matching engine
import type { Product } from "@/types"
import { isPlantProduct } from "@/lib/product-categories"

// Plant Finder Quiz Logic
// ========================

interface PlantFinderAnswers {
  light?: string
  water?: string
  pets?: string
}

/**
 * Find plants matching quiz answers
 * ponytail: Basic rule-based scoring, can be replaced with RAG later
 * @param products - Array of products to filter (pass products from async data fetch)
 * @param answers - Quiz answers for filtering
 */
// A plant suits a room that gives it at least the light it needs, and an owner who waters at least as often as it
// needs. The old rules were inverted: answers.water === "low" ("forgetful") matched EVERY plant, and
// answers.light === "medium" matched every plant.
const LIGHT_RANK: Record<string, number> = { low: 0, medium: 1, bright: 2, full_sun: 3 }
const WATER_RANK: Record<string, number> = { low: 0, medium: 1, high: 2 }

export function findMatchingPlants(products: Product[], answers: PlantFinderAnswers): Product[] {
  return products.filter((p) => {
    if (!isPlantProduct(p) || p.stockStatus === "out_of_stock") return false
    const lightOk = !answers.light || LIGHT_RANK[p.lightRequirement] <= LIGHT_RANK[answers.light]
    const waterOk = !answers.water || WATER_RANK[p.waterRequirement] <= WATER_RANK[answers.water]
    // Pets are a safety answer: never relaxed, and only plants marked pet-safe qualify.
    const petOk = answers.pets !== "yes" || p.isPetSafe
    return lightOk && waterOk && petOk
  })
}

// Chatbot Response Logic
// =======================

export const MUFFIN_QUICK_REPLIES = [
  "Low light survivors",
  "Pet safe plants",
  "Beginner friendly",
  "Workshop schedule",
  "Care tips",
  "Track my order",
]

/**
 * Get chatbot response for user input
 * ponytail: Keyword-based, will be replaced with RAG backend
 */
export function getMuffinResponse(userText: string): string {
  const text = userText.toLowerCase()

  // Low light / survival plants
  if (text.includes("low") || text.includes("dark") || text.includes("survivor")) {
    return "Snake plants, Pothos, ZZ plants. All thrive in low light. 18+ in stock."
  }

  // Pet safety
  if (text.includes("pet") || text.includes("cat") || text.includes("dog")) {
    return "Spider plants, Peperomia, Calathea, and Hoya Kerrii are all pet-safe. Filter 'Pet Safe' in our shop! 🐾"
  }

  // Beginner / easy maintenance
  if (text.includes("beginner") || text.includes("easy") || text.includes("maintenance")) {
    return "Snake plants are perfect starters. Water once a month. Nearly impossible to kill!"
  }

  // Workshops / events
  if (text.includes("workshop") || text.includes("event") || text.includes("schedule")) {
    return "Next workshop: Feb 10 - Repotting 101. View all at /events"
  }

  // Care tips / watering
  if (text.includes("care") || text.includes("water") || text.includes("tip")) {
    return "Rule of thumb: water when top inch of soil is dry. Check our Care Almanac for guides!"
  }

  // Order tracking
  if (text.includes("track") || text.includes("order")) {
    return "Login at /account/orders to track. Need help? WhatsApp us directly!"
  }

  // Default response
  return "I can help with plant recommendations, care tips, workshops, or order tracking. What would you like to know?"
}
