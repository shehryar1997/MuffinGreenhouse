// Journal data access layer - Supabase backed (public read side).
// RLS (journal_posts_read) only exposes rows whose published_at is set and not in the future.
import type { JournalPost } from "@/types"
import { supabase } from "@/supabase/client"

export const JOURNAL_COLUMNS =
  "id, slug, title, excerpt, content, author, cover_image_url, tags, is_featured, meta_title, meta_description, published_at"

export interface JournalRow {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  cover_image_url: string | null
  tags: string[] | null
  is_featured: boolean
  meta_title: string | null
  meta_description: string | null
  published_at: string | null
}

export function mapJournalRow(row: JournalRow): JournalPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    coverImage: row.cover_image_url,
    tags: row.tags ?? [],
    isFeatured: row.is_featured,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    publishedAt: row.published_at,
  }
}

/** Published posts, newest first. */
export async function getPublishedPosts(): Promise<JournalPost[]> {
  const { data, error } = await supabase
    .from("journal_posts")
    .select(JOURNAL_COLUMNS)
    .order("published_at", { ascending: false })
  if (error) {
    console.error("Error fetching journal posts:", error)
    return []
  }
  return ((data ?? []) as unknown as JournalRow[]).map(mapJournalRow)
}

export async function getJournalPostBySlug(slug: string): Promise<JournalPost | null> {
  const { data, error } = await supabase.from("journal_posts").select(JOURNAL_COLUMNS).eq("slug", slug).maybeSingle()
  if (error) {
    console.error("Error fetching journal post:", error)
    return null
  }
  return data ? mapJournalRow(data as unknown as JournalRow) : null
}

/** Rough reading time for the byline ("3 min read"). */
export function readingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
