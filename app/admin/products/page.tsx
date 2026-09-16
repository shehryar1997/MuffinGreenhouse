import Link from "next/link"
import { supabaseAdmin } from "@/supabase/admin-client"

export default async function AdminProductsPage() {
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, sku, name, category_name, price, stock_count, stock_status, published_at")
    .order("name")

  if (error) {
    return <p className="text-red-600">Error loading products: {error.message}</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">Products ({products?.length ?? 0})</h1>
        <Link
          href="/admin/products/new"
          className="bg-[#E85D2C] text-white rounded px-4 py-2 text-sm font-medium"
        >
          + Add product
        </Link>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">{p.category_name}</td>
                <td className="px-4 py-3">Rs {p.price}</td>
                <td className="px-4 py-3">
                  {p.stock_count} ({p.stock_status})
                </td>
                <td className="px-4 py-3">{p.published_at ? "Published" : "Draft"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${p.id}/edit`} className="text-[#E85D2C] hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
