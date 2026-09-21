import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { Alert, PageHeader } from "../../_components/ui"
import { OrderForm, type CatalogOption } from "./order-form"
import { createManualOrder } from "./actions"

export const dynamic = "force-dynamic"

export default async function NewOrderPage() {
  await requireAdmin()

  const [{ data: products, error }, { data: variants }] = await Promise.all([
    supabaseAdmin.from("products").select("id, sku, name, price, stock_count").order("name"),
    supabaseAdmin.from("product_variants").select("id, product_id, name, price, stock_count").eq("is_active", true).order("sort_order"),
  ])

  // A product that has variants is sold through them, so only the variants are offered.
  const variantsByProduct = new Map<string, NonNullable<typeof variants>>()
  for (const v of variants ?? []) {
    variantsByProduct.set(v.product_id, [...(variantsByProduct.get(v.product_id) ?? []), v])
  }

  const options: CatalogOption[] = []
  for (const p of products ?? []) {
    const own = variantsByProduct.get(p.id)
    if (own?.length) {
      for (const v of own) {
        options.push({ key: `${p.id}|${v.id}`, productId: p.id, variantId: v.id, label: `${p.name} — ${v.name}`, sku: p.sku, price: Number(v.price), stock: Number(v.stock_count ?? 0) })
      }
    } else {
      options.push({ key: `${p.id}|`, productId: p.id, variantId: null, label: p.name, sku: p.sku, price: Number(p.price), stock: Number(p.stock_count ?? 0) })
    }
  }

  return (
    <div>
      <PageHeader
        title="Add order"
        description="Record an order a customer placed with you personally on WhatsApp. It takes the plants out of stock and shows up in Orders like any other. No e-mail is sent to the customer."
        back={{ href: "/admin/orders", label: "Orders" }}
      />
      {error ? (
        <Alert tone="danger" title="Couldn't load the products">
          Try refreshing the page.
        </Alert>
      ) : (
        <OrderForm options={options} action={createManualOrder} />
      )}
    </div>
  )
}
