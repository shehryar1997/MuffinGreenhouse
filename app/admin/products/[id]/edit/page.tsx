import { notFound } from "next/navigation"
import { ProductForm } from "../../product-form"
import { DeleteProductButton } from "../../delete-product-button"
import { getFormLookups, updateProduct, deleteProduct } from "../../actions"
import { supabaseAdmin } from "@/supabase/admin-client"

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
        "*, images:product_images(url, alt_text), variants:product_variants(name, sku, price, stock_count)"
      )
      .eq("id", id)
      .maybeSingle(),
  ])

  if (!product) {
    notFound()
  }

  const updateWithId = updateProduct.bind(null, id)
  const deleteWithId = deleteProduct.bind(null, id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">Edit {product.name}</h1>
        <DeleteProductButton productName={product.name} action={deleteWithId} />
      </div>
      <ProductForm lookups={lookups} product={product} action={updateWithId} />
    </div>
  )
}
