import { notFound } from "next/navigation"
import { ProductForm } from "../../product-form"
import { DeleteProductButton } from "../../delete-product-button"
import { getFormLookups, updateProduct, deleteProduct } from "../../actions"
import { supabaseAdmin } from "@/supabase/admin-client"

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [lookups, { data: product }] = await Promise.all([
    getFormLookups(),
    supabaseAdmin
      .from("products")
      .select(
        "*, images:product_images(url, alt_text), variants:product_variants(name, sku, price, stock_count)"
      )
      .eq("id", params.id)
      .maybeSingle(),
  ])

  if (!product) {
    notFound()
  }

  const updateWithId = updateProduct.bind(null, params.id)
  const deleteWithId = deleteProduct.bind(null, params.id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">Edit {product.name}</h1>
        <DeleteProductButton productName={product.name} action={deleteWithId} />
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ProductForm lookups={lookups} product={product as any} action={updateWithId} />
    </div>
  )
}
