import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { DeleteCustomerButton } from "../delete-customer-button"
import { deleteCustomer } from "../actions"
import { Badge, Field, OrderStatusBadge, PageHeader, Panel, PaymentStatusBadge, inputClass, linkClass, rowLinkClass } from "../../_components/ui"
import { SubmitButton } from "../../_components/submit-button"
import { fmtDate, fmtDateTime, rs } from "../../_components/format"

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
      <PageHeader
        title={customer.name || "Unnamed customer"}
        description={customer.email}
        back={{ href: "/admin/customers", label: "Customers" }}
        badges={customer.email_verified ? <Badge tone="success">Verified</Badge> : <Badge>Unverified</Badge>}
        actions={
          <DeleteCustomerButton
            email={customer.email}
            orderCount={orders?.length ?? 0}
            action={deleteCustomer.bind(null, customer.id)}
            label="Delete profile"
          />
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Profile & orders */}
        <div className="space-y-6">
          <Panel title="Profile">
            <form action={updateCustomer} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <input id="name" name="name" type="text" defaultValue={customer.name || ""} className={inputClass} />
                </Field>
                <Field label="Email" hint="The sign-in email can't be changed here.">
                  <input id="email" name="email" type="email" defaultValue={customer.email} disabled className={inputClass} />
                </Field>
                <Field label="Phone">
                  <input id="phone" name="phone" type="tel" defaultValue={customer.phone || ""} className={inputClass} />
                </Field>
                <div>
                  <p className="mb-1.5 text-[13px] font-medium">Signed up</p>
                  <p className="flex h-9 items-center text-sm text-muted-foreground">{fmtDateTime(customer.created_at)}</p>
                </div>
              </div>
              <div>
                <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
              </div>
            </form>
          </Panel>

          <Panel title={`Order history (${orders?.length ?? 0})`} flush={!!orders?.length}>
            {orders?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {orders?.map((order) => {
                  const orderItems = (order.order_items as unknown as OrderItemRow[]) ?? []
                  return (
                    <li key={order.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/admin/orders/${order.id}`} className={`${rowLinkClass} font-mono text-[13px]`}>
                            {order.order_number}
                          </Link>
                          <OrderStatusBadge status={order.status} />
                          <PaymentStatusBadge status={order.payment_status} />
                        </div>
                        <p className="text-[13px] text-muted-foreground">
                          {fmtDate(order.created_at)} · <span className="font-medium text-foreground tabular-nums">{rs(order.total)}</span>
                        </p>
                      </div>
                      {orderItems.length > 0 && (
                        <ul className="mt-2.5 space-y-1 text-[13px] text-muted-foreground">
                          {orderItems.map((item) => (
                            <li key={item.id} className="flex justify-between gap-4">
                              <span>
                                {item.quantity}× {item.product_name}
                                {item.variant_name && ` (${item.variant_name})`}
                              </span>
                              <span className="shrink-0 tabular-nums">{rs(item.total_price)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* Sidebar: login info, wishlist, addresses */}
        <div className="space-y-6">
          <Panel title="Login">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Account</dt>
                <dd className="text-right">{customer.auth_id ? "Signed up on the website" : "Guest (no account)"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Sign-in email</dt>
                <dd className="break-all text-right">{customer.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Password</dt>
                <dd className="text-right text-muted-foreground">••••••••</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Passwords can&apos;t be viewed: the sign-in system stores only a one-way scrambled version, so nobody — including you and us —
              can read a customer&apos;s password. To help someone who&apos;s locked out, ask them to use a password reset, or delete the
              profile so they can sign up again.
            </p>
          </Panel>

          <Panel title={`Wishlist (${wishlist.length})`}>
            {wishlist.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing saved to their wishlist.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {wishlist.map((item) =>
                  item.product ? (
                    <li key={item.id} className="flex items-start justify-between gap-3">
                      <span>
                        {item.product.published_at ? (
                          <Link href={`/shop/product/${item.product.slug}`} className={linkClass} target="_blank">
                            {item.product.name}
                          </Link>
                        ) : (
                          <>
                            {item.product.name} <span className="text-xs text-muted-foreground">(unpublished)</span>
                          </>
                        )}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{rs(item.product.price)}</span>
                    </li>
                  ) : (
                    <li key={item.id} className="text-muted-foreground">
                      (product no longer available)
                    </li>
                  )
                )}
              </ul>
            )}
          </Panel>

          <Panel title="Saved addresses">
            {addresses?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No addresses saved.</p>
            ) : (
              <ul className="space-y-3">
                {addresses?.map((addr) => (
                  <li key={addr.id} className="rounded-md border border-border p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-medium">
                        {addr.label}
                        {addr.is_default && <Badge dot={false}>Default</Badge>}
                      </span>
                      <span className={`text-xs ${addr.is_active ? "text-forest-700" : "text-muted-foreground"}`}>
                        {addr.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{addr.street}</p>
                    <p className="text-muted-foreground">
                      {addr.city}, {addr.province} {addr.postal_code}
                    </p>
                    {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
                    {addr.delivery_instructions && (
                      <p className="mt-1 text-xs italic text-muted-foreground">{addr.delivery_instructions}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
