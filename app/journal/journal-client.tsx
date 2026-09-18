"use client"

import { mockJournalPosts } from "@/lib/data/journal"
import JournalGrid from "./journal-grid"

export function JournalPageClient() {
  return (
    <div className="bg-cream-100 min-h-screen">
      <div className="container mx-auto px-4 max-w-5xl py-20">
        <div className="text-center mb-16">
          <p className="font-mono text-sm text-forest-500 mb-2">Stories</p>
          <h1 className="font-serif text-display text-forest-900 mb-4">The Journal</h1>
          <p className="text-forest-600 max-w-xl mx-auto">Guides, stories, and honest notes from the greenhouse.</p>
        </div>

        <JournalGrid posts={mockJournalPosts} />
      </div>
    </div>
  )
}