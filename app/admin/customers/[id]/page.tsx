import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { DeleteCustomerButton } from "../delete-customer-button"
import { deleteCustomer } from "../actions"

// Force fresh data on every load — a dynamic route param alone doesn't
// reliably opt this page out of caching, and this page needs to reflect
// the customer's latest profile/address/order data every time.
export const dynamic = "force-dynamic"

interface OrderItemRow {
  id: string
  product_name: string
  variant_name: string | null
  quantity: number
  total_price: number
}

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params

  // Fetch customer
  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("id, email, phone, name, email_verified, created_at, auth_id")
    .eq("id", id)
    .maybeSingle()

  if (!customer) {
    notFound()
  }

  // Fetch addresses
  const { data: addresses = [] } = await supabaseAdmin
    .from("addresses")
    .select("id, label, street, city, province, postal_code, phone, is_default, is_active, delivery_instructions")
    .eq("customer_id", id)
    .order("is_default", { ascending: false })

  // Fetch orders with items
  const { data: orders = [] } = await supabaseAdmin
    .from("orders")
    .select(
      "id, order_number, status, payment_status, total, created_at, order_items:order_items(id, product_name, variant_name, quantity, unit_price, total_price)"
    )
    .eq("customer_id", id)
    .order("created_at", { ascending: false })

  // Wishlist: plants/products the customer saved on their account
  const { data: wishlistRows } = await supabaseAdmin
    .from("wishlist_items")
    .select("id, created_at, product:products(name, slug, price, published_at)")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })
  const wishlist = (wishlistRows ?? []) as unknown as Array<{
    id: string
    created_at: string | null
    product: { name: string; slug: string; price: number; published_at: string | null } | null
  }>

  async function updateCustomer(formData: FormData) {
    "use server"
    await requireAdmin()

    const name = formData.get("name") as string
    const phone = formData.get("phone") as string

    const { error } = await supabaseAdmin
      .from("customers")
      .update({ name, phone })
      .eq("id", id)

    if (error) {
      throw new Error(error.message)
    }

    redirect(`/admin/customers/${id}`)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">{customer.name || "Unnamed Customer"}</h1>
        <div className="flex items-center gap-6">
          <DeleteCustomerButton
            email={customer.email}
            orderCount={orders?.length ?? 0}
            action={deleteCustomer.bind(null, customer.id)}
            label="Delete profile"
          />
          <Link
            href="/admin/customers"
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            ← Back to customers
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile & Orders Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-serif mb-4">Profile</h2>
            <form action={updateCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    defaultValue={customer.name || ""}
                    className="w-full h-10 px-3 rounded-md border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#E85D2C] focus:ring-offset-1"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={customer.email}
                    disabled
                    className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-neutral-50 text-neutral-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={customer.phone || ""}
                    className="w-full h-10 px-3 rounded-md border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#E85D2C] focus:ring-offset-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Signup Date
                  </label>
                  <p className="text-sm text-neutral-600 py-2">
                    {customer.created_at ? new Date(customer.created_at).toLocaleString() : "—"}
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-[#E85D2C] text-white rounded px-4 py-2 text-sm font-medium hover:bg-[#d45124]"
                >
                  Save Changes
                </button>
                <span className="ml-3 text-sm">
                  {customer.email_verified ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                      Unverified
                    </span>
                  )}
                </span>
              </div>
            </form>


          {/* Order History */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-serif mb-4">
              Order History ({orders?.length ?? 0})
            </h2>
            {orders?.length === 0 ? (
              <p className="text-neutral-500 text-sm">No orders yet.</p>
            ) : (
              <div className="space-y-4">
                {orders?.map((order) => (
                  <div key={order.id} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{order.order_number}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            order.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : order.status === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            order.payment_status === "paid"
                              ? "bg-green-100 text-green-800"
                              : order.payment_status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </div>
                      <span className="text-sm text-neutral-500">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}
                      </span>
                    </div>
                    <div className="text-sm font-medium mb-2">
                      Total: Rs {order.total}
                    </div>
                    {/* Order items */}
                    {(order.order_items as unknown as OrderItemRow[])?.length > 0 && (
                      <div className="mt-3 space-y-1 text-sm text-neutral-600">
                        {(order.order_items as unknown as OrderItemRow[]).map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>
                              {item.quantity}× {item.product_name}
                              {item.variant_name && ` (${item.variant_name})`}
                            </span>
                            <span>Rs {item.total_price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: login info, wishlist, addresses */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-serif mb-4">Login</h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Account</dt>
                <dd>{customer.auth_id ? "Signed up on the website" : "Guest (no account)"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Sign-in email</dt>
                <dd className="break-all text-right">{customer.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Password</dt>
                <dd className="text-right text-neutral-600">••••••••</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-neutral-500">
              Passwords can&apos;t be viewed: the sign-in system stores only a one-way scrambled version, so nobody — including you and us —
              can read a customer&apos;s password. To help someone who&apos;s locked out, ask them to use a password reset, or delete the
              profile so they can sign up again.
            </p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-serif mb-4">Wishlist ({wishlist.length})</h2>
            {wishlist.length === 0 ? (
              <p className="text-neutral-500 text-sm">Nothing saved to their wishlist.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {wishlist.map((item) =>
                  item.product ? (
                    <li key={item.id} className="flex items-start justify-between gap-3">
                      <span>
                        {item.product.published_at ? (
                          <Link href={`/shop/product/${item.product.slug}`} className="text-[#E85D2C] hover:underline" target="_blank">
                            {item.product.name}
                          </Link>
                        ) : (
                          <>
                            {item.product.name} <span className="text-xs text-neutral-400">(unpublished)</span>
                          </>
                        )}
                      </span>
                      <span className="shrink-0 text-neutral-500">Rs {item.product.price}</span>
                    </li>
                  ) : (
                    <li key={item.id} className="text-neutral-400">
                      (product no longer available)
                    </li>
                  )
                )}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-serif mb-4">Saved Addresses</h2>
            {addresses?.length === 0 ? (
              <p className="text-neutral-500 text-sm">No addresses saved.</p>
            ) : (
              <div className="space-y-4">
                {addresses?.map((addr) => (
                  <div key={addr.id} className="border rounded p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {addr.label}
                        {addr.is_default && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600">
                            Default
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-xs ${addr.is_active ? "text-green-600" : "text-neutral-400"}`}
                      >
                        {addr.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-neutral-600">{addr.street}</p>
                    <p className="text-neutral-600">
                      {addr.city}, {addr.province} {addr.postal_code}
                    </p>
                    {addr.phone && <p className="text-neutral-600">{addr.phone}</p>}
                    {addr.delivery_instructions && (
                      <p className="text-neutral-500 text-xs mt-1 italic">
                        {addr.delivery_instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
)
}