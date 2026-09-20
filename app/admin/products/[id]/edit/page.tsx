import { notFound } from "next/navigation"
import { ProductForm } from "../../product-form"
import { DeleteProductButton } from "../../delete-product-button"
import { getFormLookups, updateProduct, deleteProduct } from "../../actions"
import { supabaseAdmin } from "@/supabase/admin-client"
import { PageHeader } from "../../../_components/ui"

// Force fresh data on every load — an edit form must always prefill with
// the product's current values, never a stale cached version.
export const dynamic = "force-dynamic"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [lookups, { data: product }] = await Promise.all([
    getFormLookups(),
    supabaseAdmin
      .from("products")
      .select(
        "*, images:product_images(url, alt_text, sort_order), variants:product_variants(id, name, sku, price, stock_count, sort_order, is_active)"
      )
      .eq("id", id)
      .order("sort_order", { referencedTable: "product_images", ascending: true })
      .order("sort_order", { referencedTable: "product_variants", ascending: true })
      .maybeSingle(),
  ])

  if (!product) {
    notFound()
  }

  // Retired variants (removed from a product that already had orders) stay hidden here.
  const visibleProduct = {
    ...product,
    variants: ((product.variants ?? []) as Array<{ is_active: boolean | null }>).filter((v) => v.is_active !== false),
  }

  const updateWithId = updateProduct.bind(null, id)
  const deleteWithId = deleteProduct.bind(null, id)

  return (
    <div>
      <PageHeader
        title={product.name}
        description={<span className="font-mono text-[13px]">{product.sku}</span>}
        back={{ href: "/admin/products", label: "Products" }}
        actions={<DeleteProductButton productName={product.name} action={deleteWithId} />}
      />
      <ProductForm lookups={lookups} product={visibleProduct} action={updateWithId} />
    </div>
  )
}
