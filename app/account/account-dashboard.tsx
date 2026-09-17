"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, Heart, ShoppingBag, MapPin, LogOut, Edit2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@/lib/supabase/browser-client"
import { formatPrice } from "@/lib/utils"

// Types
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

interface AccountDashboardProps {
  customer: Customer
  addresses: Address[]
  orders: Order[]
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}


export function AccountDashboard({ customer, addresses, orders }: AccountDashboardProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const defaultAddress = addresses.find(a => a.is_default) || addresses[0]
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedName, setEditedName] = useState(customer.name || "")
  const [editedPhone, setEditedPhone] = useState(customer.phone || "")
  const [isSaving, setIsSaving] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from("customers")
      .update({ name: editedName, phone: editedPhone })
      .eq("id", customer.id)
    if (!error) {
      setIsEditingProfile(false)
      router.refresh()
    }
    setIsSaving(false)
  }

  const handleCancelEdit = () => {
    setEditedName(customer.name || "")
    setEditedPhone(customer.phone || "")
    setIsEditingProfile(false)
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pt-20">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-[clamp(2rem,6vw,4rem)] text-[#1A1A1A] leading-[0.95] tracking-tight mb-2">
                Your Account
              </h1>
              <p className="text-forest-600">
                Welcome back, {customer.name || customer.email.split("@")[0]}
              </p>
            </div>
            <Button
              onClick={handleSignOut}
              disabled={isSigningOut}
              variant="outline"
              className="flex items-center gap-2 self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>



          {/* Dashboard Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="p-6 border border-forest-200/50 bg-white"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-forest-600" />
                  <h2 className="font-serif text-xl">Profile</h2>
                </div>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1 text-sm text-forest-600 hover:text-forest-800 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="p-1 text-green-600 hover:text-green-800 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-1">Name</label>
                  {isEditingProfile ? (
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Your name"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-forest-900">{customer.name || "Not set"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-1">Email</label>
                  <p className="text-forest-900">{customer.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-1">Phone</label>
                  {isEditingProfile ? (
                    <Input
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      placeholder="Phone number"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-forest-900">{customer.phone || "Not set"}</p>
                  )}
                </div>

                {defaultAddress && (
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-1">Default Address</label>
                    <p className="text-forest-900">{defaultAddress.street}, {defaultAddress.city}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Orders Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-6 border border-forest-200/50 bg-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <ShoppingBag className="w-6 h-6 text-forest-600" />
                <h2 className="font-serif text-xl">Orders</h2>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-forest-500 mb-4">No orders yet</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/shop/all">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3 border border-forest-100 rounded-lg hover:bg-forest-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm">#{order.order_number}</span>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-forest-600">
                        <span>{formatDate(order.created_at)}</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                      <p className="text-xs text-forest-400 mt-1">
                        {order.order_items?.length || 0} item(s)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Wishlist Card - Disabled/Coming Soon */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="p-6 border border-forest-200/50 bg-white/50 opacity-50"
            >
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-forest-600" />
                <h2 className="font-serif text-xl">Wishlist</h2>
              </div>
              <p className="text-forest-500 text-sm">Coming soon — save your favorite plants for later.</p>
            </motion.div>

            {/* Addresses Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="p-6 border border-forest-200/50 bg-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-forest-600" />
                <h2 className="font-serif text-xl">Addresses</h2>
              </div>
              {addresses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-forest-500 text-sm mb-3">No addresses saved</p>
                  <p className="text-forest-400 text-xs">Add an address during checkout</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.slice(0, 2).map((address) => (
                    <div key={address.id} className="p-3 border border-forest-100 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{address.label}</span>
                        {address.is_default && (
                          <span className="text-xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded">Default</span>
                        )}
                      </div>
                      <p className="text-forest-600 text-sm">{address.street}</p>
                      <p className="text-forest-500 text-xs">{address.city}, {address.province}</p>
                    </div>
                  ))}
                  {addresses.length > 2 && (
                    <p className="text-center text-sm text-forest-500">+{addresses.length - 2} more address(es)</p>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Continue Shopping */}
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/shop/all">Continue Shopping</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

