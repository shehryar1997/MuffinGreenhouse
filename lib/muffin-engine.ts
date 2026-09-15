// ponytail: Shared rule-based matching engine - prep for RAG backend swap
export { getAllProducts as mockProducts } from "@/lib/data/products"
import { getAllProducts } from "@/lib/data/products"
import type { Product } from "@/types"

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
 */
export function findMatchingPlants(answers: PlantFinderAnswers): Product[] {
  return getAllProducts().filter((p) => {
    const lightMatch =
      !answers.light ||
      p.lightRequirement === answers.light ||
      answers.light === "medium"
    const waterMatch =
      answers.water === p.waterRequirement || answers.water === "low"
    const petMatch = answers.pets === "no" || p.isPetSafe
    return lightMatch && waterMatch && petMatch && p.stockStatus !== "out_of_stock"
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
    return "Snake plants, Pothos, ZZ plants — all thrive in low light. 18+ in stock."
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
