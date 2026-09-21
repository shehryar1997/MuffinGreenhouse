import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { EmptyState, PageHeader, Panel, TableShell, Td, Th, Thead, Tr } from "../_components/ui"
import { rs } from "../_components/format"
import { DeleteButton } from "../_components/delete-button"
import { createCoupon, deleteCoupon, setCouponActive } from "./actions"
import { CouponForm } from "./coupon-form"
import { CouponToggle } from "./coupon-toggle"

export const dynamic = "force-dynamic"

export default async function AdminCouponsPage() {
  await requireAdmin()

  const { data, error } = await supabaseAdmin
    .from("coupons")
    .select("id, code, discount_percent, fixed_amount, max_discount, max_uses, times_used, expires_at, is_active, owner_email, kind, created_at")
    .order("created_at", { ascending: false })
  if (error) console.error("Error loading coupons:", error)
  const coupons = data ?? []

  return (
    <div>
      <PageHeader title="Coupons" description="Discount codes customers can enter at checkout. Turn a code off to stop it working without deleting it." />

      <Panel title="Add a coupon" className="mb-8">
        <CouponForm action={createCoupon} />
      </Panel>

      {coupons.length === 0 ? (
        <EmptyState title="No coupons yet" description="Add your first code above." />
      ) : (
        <TableShell minWidth="min-w-[900px]">
          <Thead>
            <tr>
              <Th>Code</Th>
              <Th>Discount</Th>
              <Th>Cap</Th>
              <Th>For</Th>
              <Th>Used</Th>
              <Th>Expires</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </Thead>
          <tbody>
            {coupons.map((c) => (
              <Tr key={c.id}>
                <Td className="font-mono font-medium">{c.code}</Td>
                <Td className="tabular-nums">{c.fixed_amount != null ? `${rs(c.fixed_amount)} off` : `${Number(c.discount_percent)}%`}</Td>
                <Td className="tabular-nums">{c.fixed_amount != null ? <span className="text-muted-foreground">-</span> : c.max_discount == null ? <span className="text-muted-foreground">No cap</span> : rs(c.max_discount)}</Td>
                <Td className="text-[13px]">
                  {c.owner_email ? (
                    <>
                      <span className="break-all">{c.owner_email}</span>
                      <p className="text-xs text-muted-foreground">{c.kind === "welcome" ? "Welcome coupon" : "Referral reward"}</p>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Everyone</span>
                  )}
                </Td>
                <Td className="tabular-nums">
                  {c.times_used}
                  {c.max_uses != null && <span className="text-muted-foreground"> / {c.max_uses}</span>}
                </Td>
                <Td className="whitespace-nowrap">
                  {c.expires_at ? (
                    <span className={new Date(c.expires_at).getTime() <= Date.now() ? "text-red-700" : undefined}>
                      {new Date(c.expires_at).toLocaleDateString("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" })}
                      {new Date(c.expires_at).getTime() <= Date.now() && " (expired)"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Never</span>
                  )}
                </Td>
                <Td>
                  <CouponToggle code={c.code} active={c.is_active} action={setCouponActive.bind(null, c.id)} />
                </Td>
                <Td align="right">
                  <DeleteButton
                    title={`Delete ${c.code}?`}
                    description="Customers won't be able to use this code any more. Past orders keep their discount. This can't be undone."
                    action={deleteCoupon.bind(null, c.id)}
                    fallbackError="Couldn't delete the coupon. Check your connection and try again."
                  />
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  )
}
