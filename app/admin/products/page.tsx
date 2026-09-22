import Link from "next/link"
import { Download, ImageIcon, Plus, Search } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { matchesProductFilters, parseProductFilters, type ProductFilter } from "@/lib/admin-product-filters"
import { isNonPlantCategoryName } from "@/lib/product-categories"
import { DeleteProductButton } from "./delete-product-button"
import { ProductPhotoButton } from "./product-photo-button"
import { VariantPhotosButton, type VariantPhotoRow } from "./variant-photos-button"
import { PublishToggle } from "./publish-toggle"
import { BulkPublishButtons } from "./bulk-publish-buttons"
import { RestockButton } from "./restock-button"
import { ProductCsvUpdate } from "./product-csv-update"
import { DuplicateProductButton } from "./duplicate-product-button"
import { readinessIssues, type ReadinessInput } from "@/lib/product-readiness"
import { deleteProduct, deleteProducts, setProductPublished, setProductsPublished } from "./actions"
import { Alert, Badge, ButtonLink, EmptyState, PageHeader, StatStrip, TableShell, Td, Th, Thead, Tr, buttonClass, inputClass, linkClass, rowLinkClass } from "../_components/ui"
import { fmtNumber, rs } from "../_components/format"
import { BulkSelect, RowCheck, SelectAllCheck } from "../_components/bulk-select"

export const dynamic = "force-dynamic"

const FILTER_LABEL: Record<ProductFilter, string> = { out_of_stock: "Out of stock", low_stock: "Low stock", attention: "Needs attention", unpublished: "Draft", published: "Published" }

interface AdminProductsPageProps {
  searchParams: Promise<{ q?: string; filter?: string; category?: string }>
}

type ProductRow = Omit<ReadinessInput, "variants"> & {
  id: string
  sku: string
  name: string
  price: number
  stock_count: number | null
  stock_status: string | null
  published_at: string | null
  card_variant_id: string | null
  is_featured: boolean | null
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const { q, filter: rawFilter, category: rawCategory } = await searchParams
  const { query, filter, category: categoryFilter } = parseProductFilters({ q, filter: rawFilter, category: rawCategory })

  const [{ data, error }, { data: categoryRows }, { data: imageRows }, { data: variantRows }, { data: waitingRows }, { data: wishRows }] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select(
        "id, sku, name, category_name, price, stock_count, stock_status, published_at, weight_kg, card_variant_id, is_featured, description, short_description, meta_description, light, water, humidity, temperature, use_case_tags"
      )
      .order("name"),
    supabaseAdmin.from("categories").select("name").order("sort_order"),
    // General photos only: a variant's own photo must not become the product's thumbnail.
    // Every photo belongs to a variant; the list thumbnail is the card variant's photo (worked out below).
    supabaseAdmin.from("product_images").select("product_id, variant_id, url, sort_order").not("variant_id", "is", null).order("sort_order"),
    // Active variants and their own photos, for the per-variant photo overlay on products that have several.
    supabaseAdmin.from("product_variants").select("id, product_id, name, price, stock_count, is_active").order("sort_order"),
    // Demand: people waiting for a restock, and wishlists.
    supabaseAdmin.from("stock_notifications").select("product_id").is("notified_at", null).limit(5000),
    supabaseAdmin.from("wishlist_items").select("product_id").limit(10000),
  ])
  const countBy = (rows: { product_id: string }[] | null) => {
    const map = new Map<string, number>()
    for (const r of rows ?? []) map.set(r.product_id, (map.get(r.product_id) ?? 0) + 1)
    return map
  }
  const waitingByProduct = countBy(waitingRows as { product_id: string }[] | null)
  const wishedByProduct = countBy(wishRows as { product_id: string }[] | null)

  // First photo of each variant (rows come sorted, so the first one seen wins).
  const photoByVariant = new Map<string, string>()
  for (const row of (imageRows ?? []) as { variant_id: string; url: string }[]) {
    if (!photoByVariant.has(row.variant_id)) photoByVariant.set(row.variant_id, row.url)
  }
  // Active variants per product, each with its photo, and the product's thumbnail: the photo of its card variant.
  const variantsByProduct = new Map<string, (VariantPhotoRow & { price: number; stock: number })[]>()
  for (const row of (variantRows ?? []) as { id: string; product_id: string; name: string; price: number; stock_count: number | null; is_active: boolean | null }[]) {
    if (row.is_active === false) continue
    const list = variantsByProduct.get(row.product_id) ?? []
    list.push({ id: row.id, name: row.name, price: Number(row.price), stock: row.stock_count ?? 0, url: photoByVariant.get(row.id) ?? null })
    variantsByProduct.set(row.product_id, list)
  }
  const thumbnailFor = (productId: string, cardVariantId: string | null) => {
    const list = variantsByProduct.get(productId) ?? []
    const chosen =
      list.find((v) => v.id === cardVariantId && v.url) ??
      [...list].filter((v) => v.url).sort((a, b) => a.price - b.price)[0]
    return chosen?.url ?? null
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

  // What each product is still missing (photos, description, care notes, search text...), see lib/product-readiness.ts.
  const issuesByProduct = new Map(
    ((data ?? []) as ProductRow[]).map((p) => [
      p.id,
      readinessIssues({ ...p, variants: (variantsByProduct.get(p.id) ?? []).map((v) => ({ name: v.name, hasPhoto: !!v.url })) }),
    ])
  )
  const allProducts = ((data ?? []) as ProductRow[]).map((p) => ({ ...p, needsAttention: (issuesByProduct.get(p.id)?.length ?? 0) > 0 }))

  const publishedCount = allProducts.filter((p) => p.published_at).length
  const unpublishedCount = allProducts.length - publishedCount
  const outOfStockCount = allProducts.filter((p) => p.stock_status === "out_of_stock").length
  const lowStockCount = allProducts.filter((p) => p.stock_status === "low_stock").length
  const attentionCount = allProducts.filter((p) => p.needsAttention).length

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
            {allProducts.length > 0 && <ProductCsvUpdate />}
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
          { label: "Low stock", value: lowStockCount, href: listHref({ q: query, filter: "low_stock" }), active: filter === "low_stock" },
          { label: "Out of stock", value: outOfStockCount, href: listHref({ q: query, filter: "out_of_stock" }), active: filter === "out_of_stock" },
          { label: "Needs attention", value: attentionCount, href: listHref({ q: query, filter: "attention" }), active: filter === "attention" },
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
        extraActions={<BulkPublishButtons action={setProductsPublished} />}
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
            <TableShell minWidth="min-w-[1180px]">
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
                  const isLowStock = p.stock_status === "low_stock"
                  const issues = issuesByProduct.get(p.id) ?? []
                  const waiting = waitingByProduct.get(p.id) ?? 0
                  const wished = wishedByProduct.get(p.id) ?? 0
                  const thumbnail = thumbnailFor(p.id, p.card_variant_id)
                  const variants = variantsByProduct.get(p.id) ?? []

                  return (
                    <Tr key={p.id} className="has-[[data-row-check]:checked]:bg-forest-50/60">
                      <Td className="w-10">
                        <RowCheck id={p.id} label={p.name} />
                      </Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/50">
                            {thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail of a stored URL
                              <img src={thumbnail} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-muted-foreground/50" aria-label="No photo yet" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link href={`/admin/products/${p.id}/edit`} className={rowLinkClass}>
                              {p.name}
                            </Link>
                            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                              {p.sku}
                              {p.is_featured && <span className="ml-2 font-sans text-[11px] text-primary">Featured</span>}
                            </p>
                            {issues.length > 0 && (
                              <p className="mt-1 flex flex-wrap gap-1">
                                {issues.slice(0, 3).map((issue) => (
                                  <Link key={issue.key} href={`/admin/products/${p.id}/edit`}>
                                    <Badge tone={issue.blocking ? "warning" : "neutral"} dot={false}>{issue.label}</Badge>
                                  </Link>
                                ))}
                                {issues.length > 3 && <span className="text-xs text-muted-foreground">+{issues.length - 3} more</span>}
                              </p>
                            )}
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
                        {(waiting > 0 || wished > 0) && (
                          <p className="mt-1 text-xs text-muted-foreground" title="Customers waiting for a restock, and wishlists">
                            {[waiting > 0 && `${waiting} waiting`, wished > 0 && `${wished} wishlisted`].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </Td>
                      <Td>
                        <PublishToggle productName={p.name} published={!!p.published_at} action={setProductPublished.bind(null, p.id)} />
                      </Td>
                      <Td align="right">
                        <div className="flex items-start justify-end gap-2">
                          {variants.length > 1 ? (
                            <VariantPhotosButton productId={p.id} productName={p.name} variants={variants} />
                          ) : variants.length === 1 ? (
                            <ProductPhotoButton productId={p.id} variantId={variants[0].id} />
                          ) : (
                            // A product with no variant yet (saved before variants owned photos): saving it once adds one.
                            <ButtonLink href={`/admin/products/${p.id}/edit`} size="sm">
                              Add photo
                            </ButtonLink>
                          )}
                          {variants.length > 0 && (
                            <RestockButton productId={p.id} productName={p.name} sizes={variants.map((v) => ({ id: v.id, name: v.name, stock: v.stock, price: v.price }))} />
                          )}
                          <ButtonLink href={`/admin/products/${p.id}/edit`} size="sm">
                            Edit
                          </ButtonLink>
                          <DuplicateProductButton productId={p.id} productName={p.name} />
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
