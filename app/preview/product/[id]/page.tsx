import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { supabaseAdmin } from "@/supabase/admin-client"
import type { SupabaseProduct } from "@/supabase/client"
import { COOKIE_NAME, isValidSessionCookie } from "@/lib/admin-session"
import { PRODUCT_SELECT } from "@/lib/data/products"
import { mapSupabaseProductToProduct } from "@/lib/data/adapters"
import { ProductDetailClient } from "@/app/shop/product/[slug]/product-detail-client"

// Staff-only preview of a product page, drafts included, exactly as customers will see it once published.
// Anyone without an admin session gets a 404, and the page is never indexed or cached.
export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Product preview", robots: { index: false, follow: false } }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ProductPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  if (!UUID.test(id) || !(await isValidSessionCookie(cookieStore.get(COOKIE_NAME)?.value))) notFound()

  const { data } = await supabaseAdmin
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })
    .maybeSingle()
  if (!data) notFound()
  const product = mapSupabaseProductToProduct(data as unknown as SupabaseProduct)
  const published = !!(data as { published_at: string | null }).published_at

  return (
    <>
      <div role="status" className="fixed inset-x-0 top-0 z-[60] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">
        <span>
          <strong>Preview.</strong> {published ? "This product is live." : "This product is a draft: customers can't see it yet."}
        </span>
        <Link href={`/admin/products/${id}/edit`} className="underline underline-offset-2">Back to editing</Link>
      </div>
      <ProductDetailClient product={product} />
    </>
  )
}
