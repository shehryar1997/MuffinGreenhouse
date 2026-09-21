// SERVER-ONLY. "Customers who bought this also bought" suggestions.
//
// How items are chosen:
//  1. Real co-purchases first: products that appear in the same past orders as the items being viewed / in the cart.
//  2. Whatever is left of the requested count is filled with a random pick of in-stock products.
// So on a new shop with few orders the list is mostly random, and it becomes genuinely "also bought" data by itself.
import type { Product } from "@/types"
import { supabase, type SupabaseProduct } from "@/supabase/client"
import { supabaseAdmin } from "@/supabase/admin-client"
import { mapSupabaseProductToProduct } from "./adapters"
import { PRODUCT_SELECT } from "./products"

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export async function getRecommendedProducts(excludeIds: string[], count = 4): Promise<Product[]> {
  const exclude = new Set(excludeIds)

  // Everything that could be shown: published and not sold out.
  const { data: pool } = await supabase
    .from("products")
    .select("id")
    .not("published_at", "is", null)
    .neq("stock_status", "out_of_stock")
    .limit(500)
  const available = new Set((pool ?? []).map((row) => row.id as string).filter((id) => !exclude.has(id)))
  if (available.size === 0) return []

  const chosen: string[] = []

  if (excludeIds.length > 0) {
    const { data: orderRows } = await supabaseAdmin.from("order_items").select("order_id").in("product_id", excludeIds).limit(300)
    const orderIds = [...new Set((orderRows ?? []).map((row) => row.order_id as string))]
    if (orderIds.length > 0) {
      const { data: together } = await supabaseAdmin.from("order_items").select("product_id").in("order_id", orderIds).limit(1500)
      const tally = new Map<string, number>()
      for (const row of together ?? []) {
        const id = row.product_id as string
        if (available.has(id)) tally.set(id, (tally.get(id) ?? 0) + 1)
      }
      chosen.push(...[...tally.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, count))
    }
  }

  if (chosen.length < count) {
    const rest = shuffle([...available].filter((id) => !chosen.includes(id)))
    chosen.push(...rest.slice(0, count - chosen.length))
  }
  if (chosen.length === 0) return []

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", chosen)
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })
  const byId = new Map((data ?? []).map((row) => [row.id as string, mapSupabaseProductToProduct(row as unknown as SupabaseProduct)]))
  return chosen.map((id) => byId.get(id)).filter((p): p is Product => !!p)
}
