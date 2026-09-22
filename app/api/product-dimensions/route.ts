import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server-client"
import { cookies } from "next/headers"
import { mergeParcel, parcelKey, type DeliveryFeeDimensions } from "@/lib/delivery-fee"

// POST /api/product-dimensions  { items: [{ productId, variantId? }] }   (or the older { productIds })
// Parcel data for the checkout's delivery-fee estimate, keyed by parcelKey(productId, variantId): a size's own
// weight/box when it has one, else the product's. /api/checkout-submit recomputes the fee the same way.
const bodySchema = z.union([
  z.object({ items: z.array(z.object({ productId: z.string().uuid(), variantId: z.string().uuid().nullish() })).min(1).max(50) }),
  z.object({ productIds: z.array(z.string().uuid()).min(1).max(50) }),
])

export async function POST(request: NextRequest) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: "Product IDs array is required" }, { status: 400 })
  const items = "items" in parsed.data ? parsed.data.items : parsed.data.productIds.map((productId) => ({ productId, variantId: null }))

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)
    const productIds = [...new Set(items.map((i) => i.productId))]
    const variantIds = [...new Set(items.flatMap((i) => (i.variantId ? [i.variantId] : [])))]

    const [{ data: products, error }, { data: variants, error: variantError }] = await Promise.all([
      supabase.from("products").select("id, box_height_cm, box_width_cm, box_breadth_cm, category_slug, weight_kg").in("id", productIds),
      variantIds.length
        ? supabase.from("product_variants").select("id, weight_kg, box_height_cm, box_width_cm, box_breadth_cm").in("id", variantIds)
        : Promise.resolve({ data: [] as Array<Record<string, number | null | string>>, error: null }),
    ])
    if (error || variantError) {
      console.error("Error fetching product dimensions:", error ?? variantError)
      return NextResponse.json({ error: "Failed to fetch product dimensions" }, { status: 500 })
    }

    const productDims = new Map<string, DeliveryFeeDimensions>(
      (products ?? []).map((p) => [
        p.id as string,
        { boxHeightCm: p.box_height_cm, boxWidthCm: p.box_width_cm, boxBreadthCm: p.box_breadth_cm, categorySlug: p.category_slug, weightKg: p.weight_kg },
      ])
    )
    const variantDims = new Map(
      (variants ?? []).map((v) => [
        v.id as string,
        { weightKg: v.weight_kg as number | null, boxHeightCm: v.box_height_cm as number | null, boxWidthCm: v.box_width_cm as number | null, boxBreadthCm: v.box_breadth_cm as number | null },
      ])
    )

    const dimensions: Record<string, DeliveryFeeDimensions> = {}
    for (const item of items) {
      const product = productDims.get(item.productId)
      if (!product) continue
      dimensions[parcelKey(item.productId, item.variantId)] = mergeParcel(product, item.variantId ? variantDims.get(item.variantId) : null)
      dimensions[item.productId] ??= product
    }
    return NextResponse.json({ dimensions })
  } catch (error) {
    console.error("Unexpected error in product-dimensions API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
