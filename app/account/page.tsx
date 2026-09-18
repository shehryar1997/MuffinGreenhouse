import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { User, Heart, ShoppingBag, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createServerClient } from "@/lib/supabase/server-client"
import { AccountDashboard } from "./account-dashboard"

export const metadata: Metadata = {
  title: "Your Account - Muffin Greenhouse",
  description: "View your orders, saved addresses, and wishlist. Manage your Muffin Greenhouse account.",
  robots: { index: false, follow: false },
}

// Types for Supabase data
interface Customer {
  id: string
  auth_id: string
  email: string
  phone: string | null
  name: string | null
}

interface Address {
  id: string
  customer_id: string
  label: string
  street: string
  city: string
  province: string
  is_default: boolean
}

interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  product_name: string
  product_sku: string
  variant_name: string | null
}

interface Order {
  id: string
  order_number: string
  customer_id: string
  status: string
  payment_status: string
  total: number
  created_at: string
  order_items: OrderItem[]
}

interface WishlistItem {
  id: string
  product_id: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: { url: string; alt: string }[]
  } | null
}

// Signed-out state component - kept exactly as original
function SignedOutState() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] pt-20">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <div>
          <h1 className="font-serif text-[clamp(2rem,6vw,4rem)] text-[#1A1A1A] leading-[0.95] tracking-tight mb-4">
            Your Account
          </h1>
          <p className="text-forest-600 text-lg mb-12 max-w-md">
            Sign in to view your orders, saved plants, and wishlist.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: User, label: "Profile", desc: "Manage your details" },
              { icon: ShoppingBag, label: "Orders", desc: "Track your plants" },
              { icon: Heart, label: "Wishlist", desc: "Saved for later" },
              { icon: MapPin, label: "Addresses", desc: "Delivery locations" },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 border border-forest-200/50 bg-white/50 opacity-50"
              >
                <item.icon className="w-6 h-6 text-forest-600 mb-4" />
                <h3 className="font-serif text-lg">{item.label}</h3>
                <p className="text-forest-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white">
              <Link href="/account/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/shop/all">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function AccountPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  // Check for active session
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return <SignedOutState />
  }

  // Fetch customer data
  const { data: customer } = await supabase
    .from("customers")
    .select("id, auth_id, email, phone, name")
    .eq("auth_id", session.user.id)
    .single()

  if (!customer) {
    // Auth exists but no customer record - sign them out
    await supabase.auth.signOut()
    redirect("/account/login")
  }

  // Fetch addresses
  const { data: addresses = [] } = await supabase
    .from("addresses")
    .select("id, customer_id, label, street, city, province, is_default")
    .eq("customer_id", customer.id)
    .eq("is_active", true)
    .order("is_default", { ascending: false })

  // Fetch orders with order_items
  const { data: orders = [] } = await supabase
    .from("orders")
    .select(`
      id, order_number, customer_id, status, payment_status, total, created_at,
      order_items:order_items(id, order_id, product_id, quantity, unit_price, total_price, product_name, product_sku, variant_name)
    `)
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })

  // Fetch wishlist items with their product (name, slug, price, first image)
  const { data: wishlistRaw = [] } = await supabase
    .from("wishlist_items")
    .select(`
      id, product_id,
      product:products(id, name, slug, price, images:product_images(url, alt_text, sort_order))
    `)
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })

  const wishlistItems: WishlistItem[] = (wishlistRaw ?? []).map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    product: item.product
      ? {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          images: (item.product.images ?? [])
            .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((img: any) => ({ url: img.url, alt: img.alt_text || item.product.name })),
        }
      : null,
  }))

  return (
    <AccountDashboard
      customer={customer}
      addresses={addresses as Address[]}
      orders={orders as Order[]}
      wishlistItems={wishlistItems}
    />
  )
}
