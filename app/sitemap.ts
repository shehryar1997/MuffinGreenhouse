export const dynamic = "force-dynamic"

import { MetadataRoute } from "next"
import { supabaseAdmin } from "@/supabase/admin-client"
import { shopByNeedCategories } from "@/config/nav.config"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.muffinplants.com"

// Static routes with their change frequency and priority
const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: `${siteUrl}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${siteUrl}/shop/all`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${siteUrl}/our-story`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${siteUrl}/faq`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${siteUrl}/contact`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${siteUrl}/journal`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    url: `${siteUrl}/events`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    url: `${siteUrl}/reviews`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  },
  {
    url: `${siteUrl}/plant-finder`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${siteUrl}/muffin`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${siteUrl}/shop-by-need`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${siteUrl}/visit-us`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${siteUrl}/delivery-and-pickup`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${siteUrl}/our-guarantee`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  // Login/register were listed here: they are noindex-worthy utility pages, not landing pages. The shop-by-need
  // pages and the legal pages were missing.
  ...shopByNeedCategories.map((c) => ({
    url: `${siteUrl}${c.href}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  })),
  ...["terms-conditions", "privacy-policy", "refund-policy", "cookie-policy"].map((slug) => ({
    url: `${siteUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "yearly" as const,
    priority: 0.2,
  })),
]

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
    changeFrequency: "weekly",
    priority: 0.8,
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
    changeFrequency: "weekly",
    priority: 0.7,
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
    changeFrequency: "monthly",
    priority: 0.6,
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
    changeFrequency: "weekly",
    priority: 0.7,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productRoutes, categoryRoutes, journalRoutes, eventRoutes] = await Promise.all([
    getProductRoutes(),
    getCategoryRoutes(),
    getJournalRoutes(),
    getEventRoutes(),
  ])

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...journalRoutes, ...eventRoutes]
}
