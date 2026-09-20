import { requireAdmin } from "@/lib/admin-auth"
import { PageHeader } from "../../_components/ui"
import { PostForm } from "../post-form"
import { createPost } from "../actions"

export default async function NewPostPage() {
  await requireAdmin()
  return (
    <div>
      <PageHeader title="New post" back={{ href: "/admin/journal", label: "Journal" }} />
      <PostForm action={createPost} submitLabel="Save post" />
    </div>
  )
}
