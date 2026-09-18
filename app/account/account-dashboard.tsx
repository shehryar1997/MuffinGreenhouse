"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, Heart, ShoppingBag, MapPin, LogOut, Edit2, Check, X, Plus, Trash2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CitySelect } from "@/components/ui/city-select"
import { createBrowserClient } from "@/lib/supabase/browser-client"
import { pakistanCities } from "@/data/pakistan-cities"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

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
  wishlistItems: WishlistItem[]
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

function getProvinceForCity(cityName: string): string {
  return pakistanCities.find((c) => c.name === cityName)?.province || ""
}

interface AddressFormState {
  label: string
  street: string
  city: string
}

const EMPTY_ADDRESS_FORM: AddressFormState = { label: "Home", street: "", city: "" }

export function AccountDashboard({ customer, addresses, orders, wishlistItems }: AccountDashboardProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Profile (name/phone) editing
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedName, setEditedName] = useState(customer.name || "")
  const [editedPhone, setEditedPhone] = useState(customer.phone || "")
  const [isSaving, setIsSaving] = useState(false)

  // Address editing: null = none open, "new" = add form, or an address id being edited
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [addressForm, setAddressForm] = useState<AddressFormState>(EMPTY_ADDRESS_FORM)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [removingWishlistId, setRemovingWishlistId] = useState<string | null>(null)

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
    const { data, error } = await supabase
      .from("customers")
      .update({ name: editedName, phone: editedPhone })
      .eq("id", customer.id)
      .select()
      .single()

    if (error || !data) {
      toast.error("Couldn't save your profile. Please try again.")
      setIsSaving(false)
      return
    }

    toast.success("Profile updated")
    setIsEditingProfile(false)
    setIsSaving(false)
    router.refresh()
  }

  const handleCancelEdit = () => {
    setEditedName(customer.name || "")
    setEditedPhone(customer.phone || "")
    setIsEditingProfile(false)
  }

  // ---- Address management ----

  const startAddAddress = () => {
    setAddressForm(EMPTY_ADDRESS_FORM)
    setEditingAddressId("new")
  }

  const startEditAddress = (address: Address) => {
    setAddressForm({ label: address.label, street: address.street, city: address.city })
    setEditingAddressId(address.id)
  }

  const cancelAddressEdit = () => {
    setEditingAddressId(null)
    setAddressForm(EMPTY_ADDRESS_FORM)
  }

  const handleSaveAddress = async () => {
    if (!addressForm.street.trim() || !addressForm.city) {
      toast.error("Street and city are required")
      return
    }

    setIsSavingAddress(true)
    const supabase = createBrowserClient()
    const province = getProvinceForCity(addressForm.city)

    if (editingAddressId === "new") {
      const { data, error } = await supabase
        .from("addresses")
        .insert({
          customer_id: customer.id,
          label: addressForm.label.trim() || "Home",
          street: addressForm.street.trim(),
          city: addressForm.city,
          province,
          is_default: addresses.length === 0,
          is_active: true,
        })
        .select()
        .single()

      if (error || !data) {
        toast.error("Couldn't save that address. Please try again.")
        setIsSavingAddress(false)
        return
      }
      toast.success("Address added")
    } else if (editingAddressId) {
      const { data, error } = await supabase
        .from("addresses")
        .update({
          label: addressForm.label.trim() || "Home",
          street: addressForm.street.trim(),
          city: addressForm.city,
          province,
        })
        .eq("id", editingAddressId)
        .select()
        .single()

      if (error || !data) {
        toast.error("Couldn't save that address. Please try again.")
        setIsSavingAddress(false)
        return
      }
      toast.success("Address updated")
    }

    setIsSavingAddress(false)
    setEditingAddressId(null)
    setAddressForm(EMPTY_ADDRESS_FORM)
    router.refresh()
  }

  const handleDeleteAddress = async (address: Address) => {
    setDeletingAddressId(address.id)
    const supabase = createBrowserClient()

    // Soft delete. Addresses can be referenced by past orders, so we never
    // hard-delete them, just hide them from this list. Always clear
    // is_default on the row being deleted itself, regardless of whether a
    // replacement gets promoted below. Otherwise an inactive row can be
    // left permanently flagged as default alongside a newly-promoted one.
    const { error } = await supabase
      .from("addresses")
      .update({ is_active: false, is_default: false })
      .eq("id", address.id)

    if (error) {
      toast.error("Couldn't remove that address. Please try again.")
      setDeletingAddressId(null)
      return
    }

    // If the deleted address was the default and others remain, promote the
    // next one so there's always a default when addresses exist.
    if (address.is_default) {
      const nextDefault = addresses.find((a) => a.id !== address.id)
      if (nextDefault) {
        await supabase.from("addresses").update({ is_default: true }).eq("id", nextDefault.id)
      }
    }

    toast.success("Address removed")
    setDeletingAddressId(null)
    router.refresh()
  }

  const handleSetDefaultAddress = async (address: Address) => {
    if (address.is_default) return
    setSettingDefaultId(address.id)
    const supabase = createBrowserClient()

    // Unset the current default(s), then set this one. Two calls kept
    // simple and sequential rather than a single compound update.
    const { error: unsetError } = await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("customer_id", customer.id)
      .eq("is_default", true)

    if (unsetError) {
      toast.error("Couldn't update your default address. Please try again.")
      setSettingDefaultId(null)
      return
    }

    const { error: setError } = await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", address.id)

    if (setError) {
      toast.error("Couldn't update your default address. Please try again.")
      setSettingDefaultId(null)
      return
    }

    toast.success("Default address updated")
    setSettingDefaultId(null)
    router.refresh()
  }

  const handleRemoveWishlistItem = async (productId: string) => {
    setRemovingWishlistId(productId)
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("customer_id", customer.id)
      .eq("product_id", productId)

    if (error) {
      toast.error("Couldn't update your wishlist. Please try again.")
      setRemovingWishlistId(null)
      return
    }

    setRemovingWishlistId(null)
    router.refresh()
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

            {/* Wishlist Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="p-6 border border-forest-200/50 bg-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-forest-600" />
                <h2 className="font-serif text-xl">Wishlist</h2>
              </div>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-forest-500 mb-4">No plants saved yet</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/shop/all">Browse Plants</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {wishlistItems.map((item) =>
                    item.product ? (
                      <div key={item.id} className="flex items-center gap-3 p-2 border border-forest-100 rounded-lg">
                        <Link href={`/shop/product/${item.product.slug}`} className="shrink-0">
                          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-forest-50">
                            {item.product.images[0]?.url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.product.images[0].url}
                                alt={item.product.images[0].alt || item.product.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </Link>
                        <Link href={`/shop/product/${item.product.slug}`} className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          <p className="text-xs text-forest-500">{formatPrice(item.product.price)}</p>
                        </Link>
                        <button
                          onClick={() => handleRemoveWishlistItem(item.product_id)}
                          disabled={removingWishlistId === item.product_id}
                          className="p-1.5 text-forest-400 hover:text-red-600 transition-colors"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </motion.div>

            {/* Addresses Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="p-6 border border-forest-200/50 bg-white"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-forest-600" />
                  <h2 className="font-serif text-xl">Addresses</h2>
                </div>
                {editingAddressId === null && (
                  <button
                    onClick={startAddAddress}
                    className="flex items-center gap-1 text-sm text-forest-600 hover:text-forest-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                )}
              </div>

              {addresses.length === 0 && editingAddressId !== "new" && (
                <div className="text-center py-4 mb-2">
                  <p className="text-forest-500 text-sm mb-1">No addresses saved</p>
                </div>
              )}

              <div className="space-y-3">
                {addresses.map((address) =>
                  editingAddressId === address.id ? (
                    <AddressForm
                      key={address.id}
                      form={addressForm}
                      setForm={setAddressForm}
                      isSaving={isSavingAddress}
                      onSave={handleSaveAddress}
                      onCancel={cancelAddressEdit}
                    />
                  ) : (
                    <div key={address.id} className="p-3 border border-forest-100 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{address.label}</span>
                        {address.is_default && (
                          <span className="text-xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded">Default</span>
                        )}
                      </div>
                      <p className="text-forest-600 text-sm">{address.street}</p>
                      <p className="text-forest-500 text-xs mb-2">{address.city}, {address.province}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <button
                          onClick={() => startEditAddress(address)}
                          className="text-forest-600 hover:text-forest-900 flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        {!address.is_default && (
                          <button
                            onClick={() => handleSetDefaultAddress(address)}
                            disabled={settingDefaultId === address.id}
                            className="text-forest-600 hover:text-forest-900 flex items-center gap-1"
                          >
                            <Star className="w-3 h-3" /> Set as default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(address)}
                          disabled={deletingAddressId === address.id}
                          className="text-forest-600 hover:text-red-600 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  )
                )}

                {editingAddressId === "new" && (
                  <AddressForm
                    form={addressForm}
                    setForm={setAddressForm}
                    isSaving={isSavingAddress}
                    onSave={handleSaveAddress}
                    onCancel={cancelAddressEdit}
                  />
                )}
              </div>
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

// Small inline add/edit address form, used both for "Add Address" and
// editing an existing one.
function AddressForm({
  form,
  setForm,
  isSaving,
  onSave,
  onCancel,
}: {
  form: AddressFormState
  setForm: (form: AddressFormState) => void
  isSaving: boolean
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="p-3 border-2 border-clay-500 rounded-lg space-y-3">
      <div>
        <label className="block text-xs font-medium text-forest-700 mb-1">Label</label>
        <Input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Home, Office, etc."
          disabled={isSaving}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-forest-700 mb-1">Street</label>
        <Input
          value={form.street}
          onChange={(e) => setForm({ ...form, street: e.target.value })}
          placeholder="House/building, street, area"
          disabled={isSaving}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-forest-700 mb-1">City</label>
        <CitySelect value={form.city} onChange={(city) => setForm({ ...form, city })} />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
