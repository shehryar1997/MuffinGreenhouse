// Cached storefront reads (server only). Every product read here is cached under PRODUCTS_CACHE_TAG for up to
// 5 minutes; admin saves and the database webhook (/api/revalidate) expire the tag, so a price or stock change
// shows on the next request instead of every visit querying Supabase. lib/data/products.ts stays uncached and
// client-safe (the plant finder and header search import it in the browser).
import { unstable_cache } from "next/cache"
import * as products from "./products"
import { PRODUCTS_CACHE_TAG } from "@/lib/cache-tags"

const cached = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string) =>
  unstable_cache(fn, ["catalog", key], { tags: [PRODUCTS_CACHE_TAG], revalidate: 300 })

export const getPaginatedProducts = cached(products.getPaginatedProducts, "paginated-products")
export const getPaginatedProductsByCategory = cached(products.getPaginatedProductsByCategory, "paginated-products-by-category")
export const getProductBySlug = cached(products.getProductBySlug, "product-by-slug")
export const getProductsByUseCase = cached(products.getProductsByUseCase, "products-by-use-case")
export const getPriceBounds = cached(products.getPriceBounds, "price-bounds")
export const getHomepageProducts = cached(products.getHomepageProducts, "homepage-products")
export const getAddOnProducts = cached(products.getAddOnProducts, "add-on-products")
