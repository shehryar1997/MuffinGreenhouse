import { MetadataRoute } from "next"
import { unstable_cache } from "next/cache"
import { PRODUCTS_CACHE_TAG } from "@/lib/cache-tags"
import { supabaseAdmin } from "@/supabase/admin-client"
import { shopByNeedCategories } from "@/config/nav.config"
import { services } from "@/lib/services"
import { NON_PLANT_CATEGORY_SLUGS } from "@/lib/product-categories"

// Rebuilt at most once an hour (and whenever the storefront webhook fires), instead of querying the database on
// every crawler request.
export const revalidate = 3600

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.muffinplants.com"

// Static routes. No lastmod/changefreq/priority: they were always "now" or guesses, and Google ignores such values.
const staticRoutes: MetadataRoute.Sitemap = [
  "",
  "/our-story",
  "/faq",
  "/contact",
  "/services",
  ...services.map((s) => `/services/${s.slug}`),
  "/plant-finder",
  "/muffin",
  "/shop-by-need",
  "/visit-us",
  "/delivery-and-pickup",
  "/our-guarantee",
  // Login/register are noindex utility pages, not landing pages.
  "/terms-conditions",
  "/privacy-policy",
  "/refund-policy",
  "/cookie-policy",
].map((path) => ({ url: `${siteUrl}${path}` }))

const USE_CASE_SLUG_TO_LABEL: Record<string, string> = {
  "low-light-survivors": "Low-Light Survivors",
  "balcony-rooftop": "Balcony & Rooftop",
  "air-purifying": "Air-Purifying",
  "pet-safe": "Pet-Safe",
  "beginner-proof": "Beginner-Proof",
  "statement-plants": "Statement Plants",
}

type LiveProduct = {
  slug: string
  updated_at: string | null
  category_slug: string | null
  use_case_tags: string[] | null
  images: { url: string }[] | null
}

// Everything live right now. Scheduled products (published_at in the future) aren't public yet, so they stay out.
async function getLiveProducts(): Promise<LiveProduct[]> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("slug, updated_at, category_slug, use_case_tags, images:product_images(url)")
    .not("slug", "is", null)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())

  if (error) {
    console.error("Error fetching products for sitemap:", error.message)
    return []
  }
  return (data ?? []) as unknown as LiveProduct[]
}

// A listing page is only listed once it has something on it: an empty listing is a thin page nobody should land on.
function listingRoutes(products: LiveProduct[]): MetadataRoute.Sitemap {
  if (products.length === 0) return []
  const newest = (list: LiveProduct[]) => {
    const times = list.map((p) => (p.updated_at ? Date.parse(p.updated_at) : 0)).filter(Boolean)
    return times.length ? new Date(Math.max(...times)) : undefined
  }
  const routes: MetadataRoute.Sitemap = []
  const plants = products.filter((p) => !(NON_PLANT_CATEGORY_SLUGS as readonly string[]).includes(p.category_slug ?? ""))
  const supplies = products.filter((p) => (NON_PLANT_CATEGORY_SLUGS as readonly string[]).includes(p.category_slug ?? ""))
  if (plants.length) routes.push({ url: `${siteUrl}/shop/all`, lastModified: newest(plants) })
  if (supplies.length) routes.push({ url: `${siteUrl}/shop/tools-equipment`, lastModified: newest(supplies) })

  for (const slug of [...new Set(products.map((p) => p.category_slug).filter((s): s is string => !!s))]) {
    routes.push({ url: `${siteUrl}/shop/${slug}`, lastModified: newest(products.filter((p) => p.category_slug === slug)) })
  }
  for (const need of shopByNeedCategories) {
    const slug = need.href.split("/").pop() ?? ""
    const label = USE_CASE_SLUG_TO_LABEL[slug]
    const tagged = plants.filter((p) => label && (p.use_case_tags ?? []).includes(label))
    if (tagged.length) routes.push({ url: `${siteUrl}${need.href}`, lastModified: newest(tagged) })
  }
  return routes
}

function productRoutes(products: LiveProduct[]): MetadataRoute.Sitemap {
  return products.map((product) => ({
    url: `${siteUrl}/shop/product/${product.slug}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
    // Image sitemap entries: the product photos Google can show in image search.
    images: [...new Set((product.images ?? []).map((i) => i.url))].slice(0, 10),
  }))
}

async function getJournalRoutes(): Promise<MetadataRoute.Sitemap> {
  const { data: posts, error } = await supabaseAdmin
    .from("journal_posts")
    .select("slug, updated_at, cover_image_url")
    .not("slug", "is", null)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString()) // scheduled (future) posts aren't public yet

  if (error) {
    console.error("Error fetching journal posts for sitemap:", error.message)
    return []
  }
  if (!posts?.length) return []
  return [
    { url: `${siteUrl}/journal` },
    ...posts.map((post) => ({
      url: `${siteUrl}/journal/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : undefined,
      ...(post.cover_image_url ? { images: [post.cover_image_url as string] } : {}),
    })),
  ]
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
  if (!events?.length) return []
  return [
    { url: `${siteUrl}/events` },
    ...events.map((event) => ({
      url: `${siteUrl}/events/${event.slug}`,
      lastModified: event.updated_at ? new Date(event.updated_at) : undefined,
    })),
  ]
}

async function hasApprovedReviews(): Promise<boolean> {
  const { count } = await supabaseAdmin.from("reviews").select("id", { count: "exact", head: true }).eq("is_hidden", false)
  return (count ?? 0) > 0
}

// The database reads are cached (the admin client never uses Next's fetch cache), so the sitemap is served from the
// cache and rebuilt hourly or when a product changes.
const buildSitemap = unstable_cache(
  async (): Promise<MetadataRoute.Sitemap> => {
    const [products, journalRoutes, eventRoutes, reviews] = await Promise.all([getLiveProducts(), getJournalRoutes(), getEventRoutes(), hasApprovedReviews()])
    return [
      ...staticRoutes,
      ...(reviews ? [{ url: `${siteUrl}/reviews` }] : []),
      ...listingRoutes(products),
      ...productRoutes(products),
      ...journalRoutes,
      ...eventRoutes,
    ]
  },
  ["sitemap"],
  { revalidate: 3600, tags: [PRODUCTS_CACHE_TAG] }
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap()
}
