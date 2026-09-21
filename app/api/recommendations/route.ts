import { NextRequest, NextResponse } from "next/server"
import { getRecommendedProducts } from "@/lib/data/recommendations"

export const dynamic = "force-dynamic"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/recommendations?exclude=<id>,<id>&limit=4
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const exclude = (params.get("exclude") ?? "").split(",").filter((id) => UUID.test(id)).slice(0, 20)
  const limit = Math.min(Math.max(Number(params.get("limit")) || 4, 1), 8)

  try {
    const products = await getRecommendedProducts(exclude, limit)
    return NextResponse.json({ products })
  } catch (err) {
    console.error("Recommendations failed:", err)
    return NextResponse.json({ products: [] })
  }
}
