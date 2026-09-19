import Link from "next/link"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { toKarachiInputValue } from "@/lib/event-format"
import { nowMs } from "@/lib/now"
import { PostForm } from "../../post-form"
import { DeletePostButton } from "../../delete-post-button"
import { deletePost, updatePost } from "../../actions"

export const dynamic = "force-dynamic"

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const { data: post } = await supabaseAdmin.from("journal_posts").select("*").eq("id", id).maybeSingle()
  if (!post) notFound()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">Edit post</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/journal" className="text-sm text-neutral-600 hover:text-neutral-900">
            ← Back to journal
          </Link>
          <DeletePostButton title={post.title} action={deletePost.bind(null, id)} />
        </div>
      </div>
      <PostForm
        action={updatePost.bind(null, id)}
        submitLabel="Save changes"
        values={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          author: post.author,
          content: post.content,
          cover_image_url: post.cover_image_url,
          tags: ((post.tags as string[] | null) ?? []).join(", "),
          is_featured: post.is_featured,
          meta_title: post.meta_title ?? "",
          meta_description: post.meta_description ?? "",
          published: Boolean(post.published_at),
          // Only pre-fill a date for scheduled posts; a live post keeps its original date when left blank.
          published_at: post.published_at && new Date(post.published_at).getTime() > nowMs() ? toKarachiInputValue(post.published_at) : "",
        }}
      />
    </div>
  )
}
