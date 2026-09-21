export const dynamic = "force-dynamic"

import { MetadataRoute } from "next"
import { supabaseAdmin } from "@/supabase/admin-client"
import { shopByNeedCategories } from "@/config/nav.config"
import { services } from "@/lib/services"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.muffinplants.com"

// Static routes. No lastmod/changefreq/priority: they were always "now" or guesses, and Google ignores such values.
const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: `${siteUrl}`,
  },
  {
    url: `${siteUrl}/our-story`,
  },
  {
    url: `${siteUrl}/faq`,
  },
  {
    url: `${siteUrl}/contact`,
  },
  {
    url: `${siteUrl}/journal`,
  },
  {
    url: `${siteUrl}/events`,
  },
  {
    url: `${siteUrl}/services`,
  },
  ...services.map((s) => ({
    url: `${siteUrl}/services/${s.slug}`,
  })),
  {
    url: `${siteUrl}/reviews`,
  },
  {
    url: `${siteUrl}/plant-finder`,
  },
  {
    url: `${siteUrl}/muffin`,
  },
  {
    url: `${siteUrl}/shop-by-need`,
  },
  {
    url: `${siteUrl}/visit-us`,
  },
  {
    url: `${siteUrl}/delivery-and-pickup`,
  },
  {
    url: `${siteUrl}/our-guarantee`,
  },
  // Login/register were listed here: they are noindex-worthy utility pages, not landing pages. The shop-by-need
  // pages and the legal pages were missing.
  ...["terms-conditions", "privacy-policy", "refund-policy", "cookie-policy"].map((slug) => ({
    url: `${siteUrl}/${slug}`,
  })),
]

// Listing pages are only worth crawling once something is on sale: while the catalogue is empty they are blank pages.
async function getShopListingRoutes(): Promise<MetadataRoute.Sitemap> {
  const { count, error } = await supabaseAdmin
    .from("products")
    .select("id", { count: "exact", head: true })
    .not("published_at", "is", null)

  if (error || !count) return []

  return [
    { url: `${siteUrl}/shop/all` },
    { url: `${siteUrl}/shop/tools-equipment` },
    ...shopByNeedCategories.map((c) => ({ url: `${siteUrl}${c.href}` })),
  ]
}

async function getProductRoutes(): Promise<MetadataRoute.Sitemap> {
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("slug, updated_at")
    .not("slug", "is", null)
    .not("published_at", "is", null)

  if (error) {
    console.error("Error fetching products for sitemap:", error.message)
    return []
  }

  return (products || []).map((product) => ({
    url: `${siteUrl}/shop/product/${product.slug}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
  }))
}

async function getCategoryRoutes(): Promise<MetadataRoute.Sitemap> {
  const { data: categories, error } = await supabaseAdmin
    .from("categories")
    .select("slug, updated_at")
    .eq("is_active", true)

  if (error) {
    console.error("Error fetching categories for sitemap:", error.message)
    return []
  }

  // Only categories that actually have a published product: empty ones are thin pages nobody should land on.
  const { data: stocked } = await supabaseAdmin.from("products").select("category_slug").not("published_at", "is", null)
  const stockedSlugs = new Set((stocked || []).map((row) => row.category_slug))

  return (categories || []).filter((category) => stockedSlugs.has(category.slug)).map((category) => ({
    url: `${siteUrl}/shop/${category.slug}`,
    lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
  }))
}

async function getJournalRoutes(): Promise<MetadataRoute.Sitemap> {
  const { data: posts, error } = await supabaseAdmin
    .from("journal_posts")
    .select("slug, updated_at")
    .not("slug", "is", null)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString()) // scheduled (future) posts aren't public yet

  if (error) {
    console.error("Error fetching journal posts for sitemap:", error.message)
    return []
  }

  return (posts || []).map((post) => ({
    url: `${siteUrl}/journal/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
  }))
}

async function getEventRoutes(): Promise<MetadataRoute.Sitemap> {
  const { data: events, error } = await supabaseAdmin
    .from("events")
    .select("slug, updated_at")
    .not("slug", "is", null)
    .eq("status", "published") // drafts and cancelled events stay out of search results

  if (error) {
    console.error("Error fetching events for sitemap:", error.message)
    return []
  }

  return (events || []).map((event) => ({
    url: `${siteUrl}/events/${event.slug}`,
    lastModified: event.updated_at ? new Date(event.updated_at) : new Date(),
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [shopListingRoutes, productRoutes, categoryRoutes, journalRoutes, eventRoutes] = await Promise.all([
    getShopListingRoutes(),
    getProductRoutes(),
    getCategoryRoutes(),
    getJournalRoutes(),
    getEventRoutes(),
  ])

  return [...staticRoutes, ...shopListingRoutes, ...categoryRoutes, ...productRoutes, ...journalRoutes, ...eventRoutes]
}
