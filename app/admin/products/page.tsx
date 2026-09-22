import Link from "next/link"
import { Download, ImageIcon, Plus, Search } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { matchesProductFilters, parseProductFilters, type ProductFilter } from "@/lib/admin-product-filters"
import { isNonPlantCategoryName } from "@/lib/product-categories"
import { DeleteProductButton } from "./delete-product-button"
import { ProductPhotoButton } from "./product-photo-button"
import { VariantPhotosButton, type VariantPhotoRow } from "./variant-photos-button"
import { PublishToggle } from "./publish-toggle"
import { deleteProduct, deleteProducts, setProductPublished } from "./actions"
import { Alert, Badge, ButtonLink, EmptyState, PageHeader, StatStrip, TableShell, Td, Th, Thead, Tr, buttonClass, inputClass, linkClass, rowLinkClass } from "../_components/ui"
import { fmtNumber, rs } from "../_components/format"
import { BulkSelect, RowCheck, SelectAllCheck } from "../_components/bulk-select"

export const dynamic = "force-dynamic"

const FILTER_LABEL: Record<ProductFilter, string> = { out_of_stock: "Out of stock", unpublished: "Draft", published: "Published" }

interface AdminProductsPageProps {
  searchParams: Promise<{ q?: string; filter?: string; category?: string }>
}

interface ProductRow {
  id: string
  sku: string
  name: string
  category_name: string | null
  price: number
  stock_count: number | null
  stock_status: string | null
  published_at: string | null
  weight_kg: number | null
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const { q, filter: rawFilter, category: rawCategory } = await searchParams
  const { query, filter, category: categoryFilter } = parseProductFilters({ q, filter: rawFilter, category: rawCategory })

  const [{ data, error }, { data: categoryRows }, { data: imageRows }, { data: variantRows }, { data: variantImageRows }] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select("id, sku, name, category_name, price, stock_count, stock_status, published_at, weight_kg")
      .order("name"),
    supabaseAdmin.from("categories").select("name").order("sort_order"),
    // General photos only: a variant's own photo must not become the product's thumbnail.
    supabaseAdmin.from("product_images").select("product_id, url, is_primary, sort_order").is("variant_id", null).order("sort_order"),
    // Active variants and their own photos, for the per-variant photo overlay on products that have several.
    supabaseAdmin.from("product_variants").select("id, product_id, name, is_active").order("sort_order"),
    supabaseAdmin.from("product_images").select("variant_id, url, sort_order").not("variant_id", "is", null).order("sort_order"),
  ])

  // First photo per product (the primary one when flagged) + how many it has.
  const photos = new Map<string, { url: string; count: number }>()
  for (const row of (imageRows ?? []) as { product_id: string; url: string; is_primary: boolean | null }[]) {
    const seen = photos.get(row.product_id)
    if (!seen) photos.set(row.product_id, { url: row.url, count: 1 })
    else {
      seen.count += 1
      if (row.is_primary) seen.url = row.url
    }
  }

  // First photo of each variant (rows come sorted, so the first one seen wins), then the variants per product.
  const photoByVariant = new Map<string, string>()
  for (const row of (variantImageRows ?? []) as { variant_id: string; url: string }[]) {
    if (!photoByVariant.has(row.variant_id)) photoByVariant.set(row.variant_id, row.url)
  }
  const variantsByProduct = new Map<string, VariantPhotoRow[]>()
  for (const row of (variantRows ?? []) as { id: string; product_id: string; name: string; is_active: boolean | null }[]) {
    if (row.is_active === false) continue
    const list = variantsByProduct.get(row.product_id) ?? []
    list.push({ id: row.id, name: row.name, url: photoByVariant.get(row.id) ?? null })
    variantsByProduct.set(row.product_id, list)
  }

  if (error) {
    return (
      <>
        <PageHeader title="Products" />
        <Alert tone="danger" title="Couldn't load products">
          {error.message}
        </Alert>
      </>
    )
  }

  const allProducts = (data ?? []) as ProductRow[]

  const publishedCount = allProducts.filter((p) => p.published_at).length
  const unpublishedCount = allProducts.length - publishedCount
  const outOfStockCount = allProducts.filter((p) => p.stock_status === "out_of_stock").length

  const categories = (categoryRows ?? [] as { name: string }[]).map((r) => r.name)
  const needsWeight = allProducts.filter(
    (p) => isNonPlantCategoryName(p.category_name) && !(p.weight_kg && p.weight_kg > 0)
  ).length

  const products = allProducts.filter((p) => matchesProductFilters(p, { query, filter, category: categoryFilter }))

  const uniqueCategories = [...new Set(categories)]
  const filtersActive = filter || query || categoryFilter
  const listHref = (params: { q?: string; filter?: string; category?: string }) => {
    const search = new URLSearchParams()
    if (params.q) search.set("q", params.q)
    if (params.filter) search.set("filter", params.filter)
    if (params.category) search.set("category", params.category)
    const qs = search.toString()
    return qs ? `/admin/products?${qs}` : "/admin/products"
  }
  // The export follows the list: with filters on, it downloads just the products shown.
  const exportHref = listHref({ q: query, filter, category: categoryFilter }).replace("/admin/products", "/admin/products/export")

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${fmtNumber(allProducts.length)} in the catalog`}
        actions={
          <>
            {products.length > 0 && (
              // A plain link, not next/link: this is a file download, not a page navigation.
              <a href={exportHref} download className={buttonClass({ variant: "secondary" })}>
                <Download className="h-4 w-4" aria-hidden />
                {filtersActive ? `Export ${products.length} shown` : "Export CSV"}
              </a>
            )}
            <ButtonLink href="/admin/products/new" variant="primary">
              <Plus className="h-4 w-4" aria-hidden />
              Add product
            </ButtonLink>
          </>
        }
      />

      <StatStrip
        items={[
          { label: "All products", value: allProducts.length, href: listHref({ q: query }), active: !filter && !categoryFilter },
          { label: "Published", value: publishedCount, href: listHref({ q: query, filter: "published" }), active: filter === "published" },
          { label: "Draft", value: unpublishedCount, href: listHref({ q: query, filter: "unpublished" }), active: filter === "unpublished" },
          { label: "Out of stock", value: outOfStockCount, href: listHref({ q: query, filter: "out_of_stock" }), active: filter === "out_of_stock" },
        ]}
      />

      {needsWeight > 0 && (
        <Alert tone="warning" className="mt-6" title={`${needsWeight} ${needsWeight === 1 ? "product needs" : "products need"} a weight`}>
          Delivery for pots, fertilizer and other equipment is charged by weight. Look for the “Add weight” tag in the list.
        </Alert>
      )}

      <form className="mt-6 flex flex-col gap-2 sm:flex-row" role="search">
        {filter && <input type="hidden" name="filter" value={filter} />}
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input type="search" name="q" aria-label="Search products" placeholder="Search by name or SKU" defaultValue={query} className={`${inputClass} pl-9`} />
        </div>
        <select name="category" aria-label="Category" defaultValue={categoryFilter || ""} className={`${inputClass} sm:w-52`}>
          <option value="">All categories</option>
          {uniqueCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit" className={buttonClass({ variant: "secondary" })}>
          Apply
        </button>
      </form>

      {filtersActive && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
          <span className="tabular-nums">{products.length} shown</span>
          {filter && <Badge dot={false}>{FILTER_LABEL[filter]}</Badge>}
          {categoryFilter && <Badge dot={false}>{categoryFilter}</Badge>}
          {query && <Badge dot={false}>“{query}”</Badge>}
          <Link href="/admin/products" className={linkClass}>
            Clear filters
          </Link>
        </p>
      )}

      <BulkSelect
        ids={products.map((p) => p.id)}
        noun="product"
        description="Products that appear in past orders can't be deleted without breaking your order history. They are kept, and you'll see which ones. Everything else is removed for good, along with its photos."
        action={deleteProducts}
      >
        <div className="mt-4">
          {products.length === 0 ? (
            <EmptyState
              title={filtersActive ? "No products match these filters" : "No products yet"}
              action={
                !filtersActive && (
                  <ButtonLink href="/admin/products/new" variant="primary">
                    Add your first product
                  </ButtonLink>
                )
              }
            />
          ) : (
            <TableShell minWidth="min-w-[1000px]">
              <Thead>
                <tr>
                  <Th className="w-10"><SelectAllCheck label="Select all products" /></Th>
                  <Th>Product</Th>
                  <Th>Category</Th>
                  <Th align="right">Price</Th>
                  <Th>Stock</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </Thead>
              <tbody>
                {products.map((p) => {
                  const needsWeightFlag = isNonPlantCategoryName(p.category_name) && !(p.weight_kg && p.weight_kg > 0)
                  const isLowStock = p.stock_count !== null && p.stock_count > 0 && p.stock_count <= 5
                  const photo = photos.get(p.id)
                  const variants = variantsByProduct.get(p.id) ?? []

                  return (
                    <Tr key={p.id} className="has-[[data-row-check]:checked]:bg-forest-50/60">
                      <Td className="w-10">
                        <RowCheck id={p.id} label={p.name} />
                      </Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/50">
                            {photo ? (
                              // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail of a stored URL
                              <img src={photo.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-muted-foreground/50" aria-label="No photo yet" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link href={`/admin/products/${p.id}/edit`} className={rowLinkClass}>
                              {p.name}
                            </Link>
                            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{p.sku}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <span className="text-foreground/80">{p.category_name ?? "—"}</span>
                        {needsWeightFlag && (
                          <Link href={`/admin/products/${p.id}/edit`} className="ml-2 align-middle">
                            <Badge tone="warning">Add weight</Badge>
                          </Link>
                        )}
                      </Td>
                      <Td align="right" className="font-medium tabular-nums">
                        {rs(p.price)}
                      </Td>
                      <Td>
                        {p.stock_count === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : p.stock_count === 0 ? (
                          <Badge tone="danger">Out of stock</Badge>
                        ) : isLowStock ? (
                          <Badge tone="warning">{p.stock_count} left</Badge>
                        ) : (
                          <span className="tabular-nums text-foreground/80">{fmtNumber(p.stock_count)}</span>
                        )}
                      </Td>
                      <Td>
                        <PublishToggle productName={p.name} published={!!p.published_at} action={setProductPublished.bind(null, p.id)} />
                      </Td>
                      <Td align="right">
                        <div className="flex items-start justify-end gap-2">
                          {variants.length > 1 ? (
                            <VariantPhotosButton productId={p.id} productName={p.name} variants={variants} generalUrl={photo?.url ?? null} />
                          ) : (
                            <ProductPhotoButton productId={p.id} />
                          )}
                          <ButtonLink href={`/admin/products/${p.id}/edit`} size="sm">
                            Edit
                          </ButtonLink>
                          <DeleteProductButton productName={p.name} action={deleteProduct.bind(null, p.id)} label="Delete" />
                        </div>
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </TableShell>
          )}
        </div>
      </BulkSelect>
    </div>
  )
}
