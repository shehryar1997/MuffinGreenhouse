import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabase, type SupabaseProduct } from "@/supabase/client"
import { PRODUCT_SELECT } from "@/lib/data/products"
import { mapSupabaseProductToProduct } from "@/lib/data/adapters"
import type { Product } from "@/types"

export const dynamic = "force-dynamic"

// POST /api/cart/refresh  { productIds: string[] }
// The cart is kept in the browser, so its prices and stock go stale. The cart asks for the current version of its
// products whenever it loads, opens, or checkout starts. Only published products come back (the anon client and RLS
// hide drafts), so a product missing from the answer is no longer for sale.
const bodySchema = z.object({ productIds: z.array(z.string().uuid()).min(1).max(50) })

export async function POST(request: NextRequest) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart" }, { status: 400 })

  const ids = [...new Set(parsed.data.productIds)]
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", ids)
    .not("published_at", "is", null)
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .order("sort_order", { foreignTable: "product_variants", ascending: true })

  if (error) {
    console.error("Cart refresh failed:", error)
    return NextResponse.json({ error: "Could not check the cart" }, { status: 500 })
  }

  const products: Product[] = (data ?? []).map((row) => mapSupabaseProductToProduct(row as unknown as SupabaseProduct))
  return NextResponse.json({ products }, { headers: { "Cache-Control": "no-store" } })
}
