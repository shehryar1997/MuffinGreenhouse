import { getAllProducts } from "@/lib/data/products"
import HomeContent from "@/components/home/home-content"

// Server Component: fetches real product data from Supabase, then hands it
// to the client component that owns the interactive homepage UI (motion,
// mood picker, parallax). Keeps the "Server fetches, Client renders" split
// used elsewhere in the app (product detail page, shop grids).
export default async function HomePage() {
  const products = await getAllProducts()
  return <HomeContent products={products} />
}
