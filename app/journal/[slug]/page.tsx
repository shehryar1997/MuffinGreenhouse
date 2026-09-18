import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getJournalPostBySlug } from "@/lib/data/journal"
import { JournalPostClient } from "./journal-post-client"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getJournalPostBySlug(params.slug)
  if (!post) {
    return { title: "Post Not Found - Muffin Greenhouse" }
  }
  return {
    title: `${post.title} - Muffin Greenhouse`,
    description: `${post.excerpt} Learn more about plant care with Muffin Greenhouse's expert guides for Karachi plant parents.`,
  }
}

export default function JournalPostPage({ params }: { params: { slug: string } }) {
  const post = getJournalPostBySlug(params.slug)
  
  if (!post) return notFound()
  
  return <JournalPostClient post={post} />
}
