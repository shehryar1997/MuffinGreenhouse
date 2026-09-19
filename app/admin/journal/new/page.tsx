import Link from "next/link"
import { requireAdmin } from "@/lib/admin-auth"
import { PostForm } from "../post-form"
import { createPost } from "../actions"

export default async function NewPostPage() {
  await requireAdmin()
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">New post</h1>
        <Link href="/admin/journal" className="text-sm text-neutral-600 hover:text-neutral-900">
          ← Back to journal
        </Link>
      </div>
      <PostForm action={createPost} submitLabel="Save post" />
    </div>
  )
}
