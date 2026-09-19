"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { fromKarachiInputValue, slugify } from "@/lib/event-format"
import { isAllowedImageUrl } from "@/lib/image-hosts"

/** What a save/delete hands back to the form. `undefined` = success (the action redirects). */
export type JournalActionResult = { error: string } | undefined

const text = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim()

function refreshPublicPages(slug?: string | null) {
  revalidatePath("/journal")
  if (slug) revalidatePath(`/journal/${slug}`)
  revalidatePath("/admin/journal")
}

function parsePost(fd: FormData, existingPublishedAt: string | null): { fields: Record<string, unknown> } | { error: string } {
  const title = text(fd, "title")
  if (title.length < 3) return { error: "Give the post a title (at least 3 characters)." }
  if (title.length > 140) return { error: "The title is too long (140 characters max)." }

  const slug = slugify(text(fd, "slug") || title)
  if (slug.length < 3) return { error: "The URL slug needs at least 3 letters or numbers." }

  const excerpt = text(fd, "excerpt")
  if (excerpt.length < 20) return { error: "Write a short summary of at least 20 characters. It appears on the journal page and in search results." }
  if (excerpt.length > 300) return { error: "The summary is too long (300 characters max)." }

  const author = text(fd, "author")
  if (author.length < 2 || author.length > 80) return { error: "Enter the author's name." }

  const content = String(fd.get("content") ?? "").trim()
  if (content.length < 50) return { error: "The article is too short. Write at least a few sentences." }
  if (content.length > 100_000) return { error: "The article is too long." }

  const cover = text(fd, "cover_image_url")
  if (cover && !isAllowedImageUrl(cover)) {
    return { error: "That image address isn't from an allowed host. Upload the image with the button instead of pasting a link." }
  }

  const tags = Array.from(
    new Set(
      text(fd, "tags")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    )
  )
  if (tags.length > 6 || tags.some((t) => t.length > 30)) return { error: "Use at most 6 tags of 30 characters each." }

  const metaTitle = text(fd, "meta_title")
  const metaDescription = text(fd, "meta_description")
  if (metaTitle.length > 70) return { error: "The search title is too long (70 characters max)." }
  if (metaDescription.length > 170) return { error: "The search description is too long (170 characters max)." }

  // Draft = no publish date. Publishing keeps an existing date on re-save; a date typed into the form
  // schedules the post for later (the database only shows posts whose date has passed).
  let publishedAt: string | null = null
  if (fd.get("publish") === "on") {
    const scheduled = text(fd, "published_at")
    if (scheduled) {
      publishedAt = fromKarachiInputValue(scheduled)
      if (!publishedAt) return { error: "The publish date isn't valid." }
    } else {
      publishedAt = existingPublishedAt ?? new Date().toISOString()
    }
  }

  return {
    fields: {
      slug,
      title,
      excerpt,
      author,
      content,
      cover_image_url: cover || null,
      tags,
      is_featured: fd.get("is_featured") === "on",
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      published_at: publishedAt,
    },
  }
}

const friendly = (error: { code?: string; message: string }) =>
  error.code === "23505" ? "Another post already uses that URL slug. Change the slug and save again." : error.message

// Only one post leads the journal page at a time.
async function clearOtherFeatured(keepId: string) {
  await supabaseAdmin.from("journal_posts").update({ is_featured: false }).neq("id", keepId).eq("is_featured", true)
}

export async function createPost(formData: FormData): Promise<JournalActionResult> {
  await requireAdmin()
  const parsed = parsePost(formData, null)
  if ("error" in parsed) return { error: parsed.error }

  const { data, error } = await supabaseAdmin.from("journal_posts").insert(parsed.fields).select("id, slug").single()
  if (error) return { error: friendly(error) }
  if (parsed.fields.is_featured) await clearOtherFeatured(data.id)

  refreshPublicPages(data.slug)
  redirect("/admin/journal")
}

export async function updatePost(postId: string, formData: FormData): Promise<JournalActionResult> {
  await requireAdmin()
  const { data: existing } = await supabaseAdmin.from("journal_posts").select("slug, published_at").eq("id", postId).maybeSingle()
  if (!existing) return { error: "This post no longer exists. It may have been deleted." }

  const parsed = parsePost(formData, (existing.published_at as string | null) ?? null)
  if ("error" in parsed) return { error: parsed.error }

  const { error } = await supabaseAdmin.from("journal_posts").update(parsed.fields).eq("id", postId)
  if (error) return { error: friendly(error) }
  if (parsed.fields.is_featured) await clearOtherFeatured(postId)

  refreshPublicPages(existing.slug)
  refreshPublicPages(parsed.fields.slug as string)
  redirect("/admin/journal")
}

export async function deletePost(postId: string): Promise<JournalActionResult> {
  await requireAdmin()
  const { data: existing } = await supabaseAdmin.from("journal_posts").select("slug").eq("id", postId).maybeSingle()
  const { error } = await supabaseAdmin.from("journal_posts").delete().eq("id", postId)
  if (error) return { error: error.message }
  refreshPublicPages(existing?.slug)
  redirect("/admin/journal")
}
