// Journal data access layer - wraps mock data for easy Supabase migration
import { JournalPost } from "@/types"
import { mockJournalPosts } from "@/data/mock-products"

export { mockJournalPosts }

// ponytail: Wrapper functions that delegate to mock-products.ts
// When we move to Supabase, only these functions need updating

export function getAllJournalPosts(): JournalPost[] {
  return mockJournalPosts
}

export function getJournalPostBySlug(slug: string): JournalPost | undefined {
  return mockJournalPosts.find((p) => p.slug === slug)
}
