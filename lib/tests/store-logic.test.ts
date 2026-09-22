// Unit tests for the store's pure logic. Run with: npm run test:unit
import { test } from "node:test"
import assert from "node:assert/strict"
import type { CartItem, Product, ProductVariant } from "@/types"
import { reconcileCart, describeCartChange } from "@/lib/cart-reconcile"
import { readinessIssues, MIN_DESCRIPTION_CHARS, toReadinessInput } from "@/lib/product-readiness"
import { parseUploadedUrl, sizedImageUrl, socialImageUrl, uploadSiblingKeys } from "@/lib/image-urls"
import { mergeParcel, parcelKey, calculateDeliveryFee, qualifiesForFreeDelivery } from "@/lib/delivery-fee"
import { snippet, pageMetadata } from "@/lib/seo"
import { productImageAlt } from "@/lib/data/adapters"
import { canDeleteOrder } from "@/app/admin/orders/delete-order-description"
import { matchesProductFilters, parseProductFilters } from "@/lib/admin-product-filters"

// ---------------------------------------------------------------- fixtures
function variant(id: string, patch: Partial<ProductVariant> = {}): ProductVariant {
  return { id, name: id.toUpperCase(), price: 1000, stockStatus: "in_stock", stockCount: 5, sku: `SKU-${id}`, images: [], ...patch }
}
function product(id: string, variants: ProductVariant[], patch: Partial<Product> = {}): Product {
  return {
    id,
    name: `Plant ${id}`,
    slug: `plant-${id}`,
    category: { id: "c", slug: "aroids", name: "Aroids", sortOrder: 1, isActive: true },
    description: "desc",
    price: Math.min(...variants.map((v) => v.price)),
    currency: "PKR",
    stockStatus: "in_stock",
    stockCount: variants.reduce((n, v) => n + v.stockCount, 0),
    images: [],
    careInfo: { light: "", water: "", humidity: "", temperature: "", soil: "", fertilizer: "", toxicity: "" },
    variants,
    useCaseTags: [],
    isNewArrival: false,
    isPetSafe: false,
    isImported: false,
    isHardLeaf: false,
    difficulty: "beginner",
    lightRequirement: "bright",
    waterRequirement: "medium",
    size: "medium",
    createdAt: "2026-09-01",
    updatedAt: "2026-09-01",
    ...patch,
  }
}
const line = (p: Product, v: ProductVariant | undefined, quantity: number): CartItem => ({ product: p, variant: v, quantity })

// ---------------------------------------------------------------- cart reconciliation
test("cart: unchanged cart stays unchanged", () => {
  const p = product("a", [variant("s")])
  const { items, changes } = reconcileCart([line(p, p.variants[0], 2)], [p])
  assert.equal(items.length, 1)
  assert.equal(items[0].quantity, 2)
  assert.deepEqual(changes, [])
})

test("cart: unpublished product is removed", () => {
  const p = product("a", [variant("s")])
  const { items, changes } = reconcileCart([line(p, p.variants[0], 1)], [])
  assert.equal(items.length, 0)
  assert.equal(changes[0].kind, "removed")
  assert.match(describeCartChange(changes[0]), /no longer available/)
})

test("cart: sold-out size is removed, other sizes kept", () => {
  const old = product("a", [variant("s"), variant("m")])
  const fresh = product("a", [variant("s", { stockCount: 0, stockStatus: "out_of_stock" }), variant("m")])
  const { items, changes } = reconcileCart([line(old, old.variants[0], 1), line(old, old.variants[1], 1)], [fresh])
  assert.equal(items.length, 1)
  assert.equal(items[0].variant?.id, "m")
  assert.equal(changes[0].kind, "removed")
  assert.match(describeCartChange(changes[0]), /sold out/)
})

test("cart: retired size is removed", () => {
  const old = product("a", [variant("s"), variant("m")])
  const fresh = product("a", [variant("m")])
  const { items, changes } = reconcileCart([line(old, old.variants[0], 1)], [fresh])
  assert.equal(items.length, 0)
  assert.equal(changes[0].kind === "removed" && changes[0].reason, "size_gone")
})

test("cart: quantity is capped at the stock that is left", () => {
  const old = product("a", [variant("s", { stockCount: 5 })])
  const fresh = product("a", [variant("s", { stockCount: 2, stockStatus: "low_stock" })])
  const { items, changes } = reconcileCart([line(old, old.variants[0], 4)], [fresh])
  assert.equal(items[0].quantity, 2)
  assert.deepEqual(changes.map((c) => c.kind), ["quantity"])
})

test("cart: a price change is applied and reported", () => {
  const old = product("a", [variant("s", { price: 1000 })])
  const fresh = product("a", [variant("s", { price: 1200 })])
  const { items, changes } = reconcileCart([line(old, old.variants[0], 1)], [fresh])
  assert.equal(items[0].variant?.price, 1200)
  assert.equal(changes[0].kind, "price")
  assert.match(describeCartChange(changes[0]), /1,200/)
})

test("cart: an old line without a size gets the only size, or is dropped when there are several", () => {
  const one = product("a", [variant("s")])
  const many = product("b", [variant("s"), variant("m")])
  const { items, changes } = reconcileCart([line(one, undefined, 1), line(many, undefined, 1)], [one, many])
  assert.equal(items.length, 1)
  assert.equal(items[0].variant?.id, "s")
  assert.equal(changes[0].kind === "removed" && changes[0].reason, "choose_size")
})

// ---------------------------------------------------------------- readiness
const complete = {
  category_name: "Aroids",
  description: "x".repeat(MIN_DESCRIPTION_CHARS),
  short_description: "Summary",
  meta_description: "Search text",
  light: "Bright",
  water: "Weekly",
  humidity: null,
  temperature: null,
  use_case_tags: ["Pet-Safe"],
  weight_kg: null,
  variants: [{ name: "Small", hasPhoto: true }],
}

test("readiness: a complete plant has no issues", () => {
  assert.deepEqual(readinessIssues(complete), [])
})

test("readiness: missing photos and sizes block publishing", () => {
  assert.ok(readinessIssues({ ...complete, variants: [] }).some((i) => i.key === "variants" && i.blocking))
  const photos = readinessIssues({ ...complete, variants: [{ name: "S", hasPhoto: true }, { name: "M", hasPhoto: false }] })
  assert.ok(photos.some((i) => i.key === "photos" && i.blocking && i.label.includes("1 sizes")))
})

test("readiness: supplies need a weight but no care notes or tags", () => {
  const pots = readinessIssues({ ...complete, category_name: "Pots", light: null, water: null, use_case_tags: [] })
  assert.ok(pots.some((i) => i.key === "weight"))
  assert.ok(!pots.some((i) => i.key === "care" || i.key === "tags"))
})

test("readiness: short description, summary, search text and care notes are hints, not blockers", () => {
  const issues = readinessIssues({ ...complete, description: "short", short_description: "", meta_description: null, light: null, water: null })
  for (const key of ["description", "summary", "seo", "care"]) assert.ok(issues.some((i) => i.key === key && !i.blocking), key)
})

test("readiness: rows from the database ignore retired sizes", () => {
  const input = toReadinessInput({
    ...complete,
    variants: [
      { id: "1", name: "S", is_active: true },
      { id: "2", name: "Old", is_active: false },
    ],
    images: [{ variant_id: "1" }],
  })
  assert.deepEqual(input.variants, [{ name: "S", hasPhoto: true }])
})

// ---------------------------------------------------------------- image URLs
const upload = "https://images.muffinplants.com/products/0f8fad5b-d9cb-469f-a165-70867728950e.avif"

test("images: uploads map to sized copies and a social JPEG", () => {
  assert.ok(parseUploadedUrl(upload))
  assert.equal(sizedImageUrl(upload, 300), upload.replace(".avif", ".w400.avif"))
  assert.equal(sizedImageUrl(upload, 640), upload.replace(".avif", ".w800.avif"))
  assert.equal(sizedImageUrl(upload, 1080), upload.replace(".avif", ".w1200.avif"))
  assert.equal(sizedImageUrl(upload, 1920), upload) // bigger than any copy: the original
  assert.equal(socialImageUrl(upload), upload.replace(".avif", ".og.jpg"))
})

test("images: other URLs are left alone", () => {
  for (const url of ["/placeholder-plant.png", "https://images.muffinplants.com/products/zz-small.avif", "https://images.unsplash.com/photo.avif", ""]) {
    assert.equal(parseUploadedUrl(url), null)
    assert.equal(sizedImageUrl(url, 400), url)
    assert.equal(socialImageUrl(url), null)
  }
})

test("images: deleting an upload also deletes its copies", () => {
  const keys = uploadSiblingKeys("products/0f8fad5b-d9cb-469f-a165-70867728950e.avif")
  assert.equal(keys.length, 5)
  assert.ok(keys.includes("products/0f8fad5b-d9cb-469f-a165-70867728950e.og.jpg"))
  assert.deepEqual(uploadSiblingKeys("products/legacy/photo.jpg"), ["products/legacy/photo.jpg"])
})

// ---------------------------------------------------------------- delivery
const potted = { categorySlug: "aroids", boxHeightCm: 20, boxWidthCm: 20, boxBreadthCm: 20, weightKg: 1 }

test("delivery: a size's own parcel wins, a partial box never mixes", () => {
  assert.equal(parcelKey("p", "v"), "p:v")
  assert.equal(parcelKey("p", null), "p")
  const big = mergeParcel(potted, { weightKg: 6, boxHeightCm: 60, boxWidthCm: 40, boxBreadthCm: 40 })
  assert.deepEqual([big.weightKg, big.boxHeightCm], [6, 60])
  const partial = mergeParcel(potted, { weightKg: null, boxHeightCm: 60, boxWidthCm: null, boxBreadthCm: null })
  assert.deepEqual([partial.boxHeightCm, partial.boxWidthCm, partial.weightKg], [20, 20, 1])
})

test("delivery: a bigger size outside Karachi costs more than a small one", () => {
  const small = calculateDeliveryFee({ deliveryType: "delivery", city: "Lahore", items: [{ dim: potted, quantity: 1 }] })
  const large = calculateDeliveryFee({
    deliveryType: "delivery",
    city: "Lahore",
    items: [{ dim: mergeParcel(potted, { weightKg: 6, boxHeightCm: 60, boxWidthCm: 40, boxBreadthCm: 40 }), quantity: 1 }],
  })
  assert.ok(large > small, `${large} > ${small}`)
  assert.equal(calculateDeliveryFee({ deliveryType: "pickup", city: "Lahore", items: [{ dim: potted, quantity: 1 }] }), 0)
  assert.equal(qualifiesForFreeDelivery(10_000, 3), true)
  assert.equal(qualifiesForFreeDelivery(10_000, 4), false)
})

// ---------------------------------------------------------------- SEO
test("seo: snippets are cut on a word boundary and stripped of markup", () => {
  const long = "## Care\n**Bright** light and weekly water. ".repeat(10)
  const out = snippet(long, 80)
  assert.ok(out.length <= 80)
  assert.ok(out.endsWith("…"))
  assert.ok(!/[#*]/.test(out))
  assert.equal(snippet("Short text."), "Short text.")
})

test("seo: every page gets its own social title, image and canonical", () => {
  const meta = pageMetadata({ title: "Pink Princess", description: "d", path: "/shop/product/pink" })
  assert.equal((meta.openGraph as { title: string }).title, "Pink Princess - Muffin Plants")
  assert.ok(((meta.openGraph as { images: unknown[] }).images).length === 1)
  assert.deepEqual(meta.alternates, { canonical: "/shop/product/pink" })
  assert.equal(meta.robots, undefined)
  assert.deepEqual(pageMetadata({ title: "x", description: "y", noindex: true }).robots, { index: false, follow: true })
})

test("seo: photo alt text names the plant and size", () => {
  assert.equal(productImageAlt("Medium", "Monstera", "Medium"), "Monstera, Medium")
  assert.equal(productImageAlt("", "Monstera", "Standard"), "Monstera")
  assert.equal(productImageAlt("A tall monstera in a clay pot", "Monstera", "Medium"), "A tall monstera in a clay pot")
})

// ---------------------------------------------------------------- admin rules
test("orders: only unpaid, unshipped orders can be deleted", () => {
  assert.equal(canDeleteOrder({ status: "pending", payment_status: "pending" }), true)
  assert.equal(canDeleteOrder({ status: "cancelled", payment_status: "pending" }), true)
  assert.equal(canDeleteOrder({ status: "confirmed", payment_status: "paid" }), false)
  assert.equal(canDeleteOrder({ status: "cancelled", payment_status: "paid" }), false)
  assert.equal(canDeleteOrder({ status: "shipped", payment_status: "pending" }), false)
  assert.equal(canDeleteOrder({ status: "delivered", payment_status: "paid" }), false)
})

test("products list: low-stock and needs-attention filters", () => {
  const base = { name: "Monstera", sku: "MON", category_name: "Aroids", published_at: "x" }
  const low = parseProductFilters({ filter: "low_stock" })
  assert.equal(matchesProductFilters({ ...base, stock_status: "low_stock" }, low), true)
  assert.equal(matchesProductFilters({ ...base, stock_status: "in_stock" }, low), false)
  const attention = parseProductFilters({ filter: "attention" })
  assert.equal(matchesProductFilters({ ...base, stock_status: "in_stock", needsAttention: true }, attention), true)
  assert.equal(matchesProductFilters({ ...base, stock_status: "in_stock", needsAttention: false }, attention), false)
  assert.equal(parseProductFilters({ filter: "bogus" }).filter, undefined)
})

test("prices: 'starting from' ignores sold-out sizes", async () => {
  const { startingFromPrice, displayPrice } = await import("@/lib/product-photos")
  const p = product("a", [variant("s", { price: 500, stockStatus: "out_of_stock", stockCount: 0 }), variant("m", { price: 800 }), variant("l", { price: 1200 })])
  assert.equal(startingFromPrice(p), 800)
  assert.equal(displayPrice(p), 800)
  const allGone = product("b", [variant("s", { price: 500, stockStatus: "out_of_stock", stockCount: 0 }), variant("m", { price: 800, stockStatus: "out_of_stock", stockCount: 0 })])
  assert.equal(startingFromPrice(allGone), 500)
  const oneLeft = product("c", [variant("s", { price: 500, stockStatus: "out_of_stock", stockCount: 0 }), variant("m", { price: 800 })])
  assert.equal(startingFromPrice(oneLeft), null)
  assert.equal(displayPrice(oneLeft), 800)
})
