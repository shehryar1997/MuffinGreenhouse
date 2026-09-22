import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { PageHeader } from "../../_components/ui"
import { CategoryForm } from "../category-form"
import { updateCategory } from "../actions"

export const dynamic = "force-dynamic"

export default async function EditCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin()
  const { slug } = await params
  const { data: category } = await supabaseAdmin
    .from("categories")
    .select("slug, name, tagline, description, intro, meta_title, meta_description")
    .eq("slug", slug)
    .maybeSingle()
  if (!category) notFound()

  return (
    <div>
      <PageHeader
        title={category.name as string}
        description={<span className="font-mono text-[13px]">/shop/{slug}</span>}
        back={{ href: "/admin/categories", label: "Categories" }}
      />
      <CategoryForm category={category as Parameters<typeof CategoryForm>[0]["category"]} action={updateCategory.bind(null, slug)} />
    </div>
  )
}
