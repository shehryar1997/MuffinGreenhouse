import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/supabase/admin-client"
import { isAdminRequest } from "@/lib/admin-auth"
import { matchesProductFilters, parseProductFilters } from "@/lib/admin-product-filters"
import { neutralizeFormula, toCsv } from "@/lib/csv"
import { EXPORT_PRODUCT_COLUMNS, productsToRows, type ExportImage, type ExportProduct, type ExportVariant } from "@/lib/product-import"

export const dynamic = "force-dynamic"

// Supabase returns at most 1000 rows per request, and photos alone can pass that, so read in pages.
const PAGE = 1000
type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>

async function fetchAll<T>(page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    out.push(...(data ?? []))
    if (!data || data.length < PAGE) return out
  }
}

function groupBy<T extends { product_id: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const list = map.get(row.product_id)
    if (list) list.push(row)
    else map.set(row.product_id, [row])
  }
  return map
}

type ImageRow = ExportImage & { product_id: string; sort_order: number | null }
type VariantRow = ExportVariant & { product_id: string; sort_order: number | null; is_active: boolean | null }
type ProductRow = ExportProduct & { name: string; sku: string; category_name: string | null; stock_status: string | null }

// One CSV of the products in the current list view (same ?q= ?filter= ?category= as /admin/products), laid out
// like the import template: photos and variants spread across numbered columns.
export async function GET(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const params = new URL(request.url).searchParams
  const filters = parseProductFilters({ q: params.get("q"), filter: params.get("filter"), category: params.get("category") })

  let products: ProductRow[], images: ImageRow[], variants: VariantRow[]
  try {
    ;[products, images, variants] = await Promise.all([
      fetchAll<ProductRow>((from, to) =>
        supabaseAdmin.from("products").select(`${EXPORT_PRODUCT_COLUMNS}, stock_status`).order("name").order("id").range(from, to) as unknown as Page<ProductRow>
      ),
      fetchAll<ImageRow>((from, to) =>
        supabaseAdmin.from("product_images").select("product_id, url, alt_text, sort_order").order("id").range(from, to) as unknown as Page<ImageRow>
      ),
      fetchAll<VariantRow>((from, to) =>
        supabaseAdmin.from("product_variants").select("product_id, name, sku, price, stock_count, sort_order, is_active").order("id").range(from, to) as unknown as Page<VariantRow>
      ),
    ])
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not read products." }, { status: 500 })
  }

  const selected = products.filter((p) => matchesProductFilters(p, filters))
  const bySort = (a: { sort_order: number | null }, b: { sort_order: number | null }) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  const imagesByProduct = groupBy(images)
  const variantsByProduct = groupBy(variants.filter((v) => v.is_active !== false)) // retired variants stay out of the sheet
  for (const list of imagesByProduct.values()) list.sort(bySort)
  for (const list of variantsByProduct.values()) list.sort(bySort)

  const rows = productsToRows(selected, imagesByProduct, variantsByProduct).map((row) => row.map(neutralizeFormula))
  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
