import Link from "next/link"
import { notFound } from "next/navigation"
import { Eye } from "lucide-react"
import { ProductForm } from "../../product-form"
import { DeleteProductButton } from "../../delete-product-button"
import { DuplicateProductButton } from "../../duplicate-product-button"
import { getFormLookups, updateProduct, deleteProduct } from "../../actions"
import { supabaseAdmin } from "@/supabase/admin-client"
import { Alert, ButtonLink, PageHeader, Panel } from "../../../_components/ui"
import { fmtDateTime } from "../../../_components/format"

// Force fresh data on every load — an edit form must always prefill with
// the product's current values, never a stale cached version.
export const dynamic = "force-dynamic"

const REASON: Record<string, string> = {
  initial_stock: "Added",
  sale: "Sold",
  order_cancelled: "Order cancelled",
  order_expired: "Unpaid order released",
  restock: "Restocked",
  adjustment: "Edited",
}

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ copied?: string }> }) {
  const { id } = await params
  const { copied } = await searchParams
  const [lookups, { data: product }, { data: history }] = await Promise.all([
    getFormLookups(),
    supabaseAdmin
      .from("products")
      .select(
        "*, images:product_images(url, alt_text, sort_order, variant_id, is_primary), variants:product_variants(id, name, sku, price, stock_count, sort_order, is_active, compare_at_price, weight_kg, box_height_cm, box_width_cm, box_breadth_cm)"
      )
      .eq("id", id)
      .order("sort_order", { referencedTable: "product_images", ascending: true })
      .order("sort_order", { referencedTable: "product_variants", ascending: true })
      .maybeSingle(),
    // Where the stock went: sales, cancellations, restocks and edits (written by the database, see inventory_log).
    supabaseAdmin
      .from("inventory_log")
      .select("id, change_type, quantity_change, previous_count, new_count, notes, created_at, variant:product_variants(name), ref_order:reference_id")
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .limit(40),
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
  const rows = (history ?? []) as unknown as Array<{
    id: string
    change_type: string
    quantity_change: number
    previous_count: number
    new_count: number
    notes: string | null
    created_at: string
    variant: { name: string } | null
    ref_order: string | null
  }>

  return (
    <div>
      <PageHeader
        title={product.name}
        description={<span className="font-mono text-[13px]">{product.sku}</span>}
        back={{ href: "/admin/products", label: "Products" }}
        actions={
          <>
            <ButtonLink href={`/preview/product/${id}`} target="_blank">
              <Eye className="h-4 w-4" aria-hidden />
              {product.published_at ? "View page" : "Preview"}
            </ButtonLink>
            <DuplicateProductButton productId={id} productName={product.name} />
            <DeleteProductButton productName={product.name} action={deleteWithId} />
          </>
        }
      />
      {copied && (
        <Alert tone="info" className="mb-6" title="This is a copy, saved as a draft">
          Change the name, add a photo for every size and set the stock, then tick Published.
        </Alert>
      )}
      <ProductForm lookups={lookups} product={visibleProduct} action={updateWithId} />

      <div className="mt-10 max-w-5xl">
        <Panel title="Stock history" description="Every change to this product's stock, newest first." flush>
          {rows.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">No stock changes recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-2 font-medium">When</th>
                  <th scope="col" className="px-3 py-2 font-medium">Size</th>
                  <th scope="col" className="px-3 py-2 font-medium">What happened</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Change</th>
                  <th scope="col" className="px-5 py-2 text-right font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-5 py-2.5 text-muted-foreground">{fmtDateTime(r.created_at)}</td>
                    <td className="px-3 py-2.5">{r.variant?.name ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      {REASON[r.change_type] ?? r.change_type}
                      {r.notes && <span className="text-muted-foreground"> · {r.notes}</span>}
                      {r.ref_order && (
                        <Link href={`/admin/orders/${r.ref_order}`} className="ml-1 text-primary underline-offset-2 hover:underline">
                          view order
                        </Link>
                      )}
                    </td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${r.quantity_change < 0 ? "text-red-700" : "text-forest-700"}`}>
                      {r.quantity_change > 0 ? `+${r.quantity_change}` : r.quantity_change}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{r.new_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  )
}
