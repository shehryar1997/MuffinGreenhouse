import type { Metadata } from "next"
import { getHomepageProducts } from "@/lib/data/catalog"
import { pageMetadata } from "@/lib/seo"
import { getUpcomingEvents } from "@/lib/data/events"
import { getPublishedPosts } from "@/lib/data/journal"
import HomeContent from "@/components/home/home-content"

// ISR: revalidate every 5 minutes + on product updates via /api/revalidate
export const revalidate = 300

export const metadata: Metadata = pageMetadata({
  title: "Muffin Plants: Buy Indoor Plants Online in Karachi & Pakistan",
  description: "Rare and easy indoor plants sourced from around the world and propagated in Karachi: aroids, hoyas, sansevierias and more. Pots, soil and honest care tips, delivered across Pakistan.",
  path: "/",
  absoluteTitle: true,
})

// Server Component: fetches real product, event and journal data from Supabase, then hands it
// to the client component that owns the interactive homepage UI (motion,
// parallax). Keeps the "Server fetches, Client renders" split
// used elsewhere in the app (product detail page, shop grids).
export default async function HomePage() {
  const [products, events, posts] = await Promise.all([getHomepageProducts(12), getUpcomingEvents(), getPublishedPosts()])
  return <HomeContent products={products} events={events.slice(0, 2)} posts={posts.slice(0, 3)} />
}
