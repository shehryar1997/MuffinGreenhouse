"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"

export type CustomerActionResult = { error: string } | undefined

/**
 * Permanently deletes a customer profile: the customers row, their saved addresses and
 * wishlist (both cascade), and their website login (Supabase Auth user).
 *
 * Orders are financial records and are protected: a customer who has orders can only be
 * deleted with `deleteOrders = true`, which also deletes those orders (and their line items).
 * That removes them from revenue totals and does NOT return their stock.
 */
export async function deleteCustomer(customerId: string, deleteOrders: boolean): Promise<CustomerActionResult> {
  await requireAdmin()

  const { data: customer, error: readError } = await supabaseAdmin
    .from("customers")
    .select("id, email, auth_id")
    .eq("id", customerId)
    .maybeSingle()
  if (readError) return { error: readError.message }
  if (!customer) return { error: "This customer no longer exists." }

  const { count: orderCount, error: countError } = await supabaseAdmin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
  if (countError) return { error: countError.message }

  if ((orderCount ?? 0) > 0) {
    if (!deleteOrders) {
      return {
        error: `${customer.email} has ${orderCount} order${orderCount === 1 ? "" : "s"}. Orders are financial records, so the profile can only be deleted together with them.`,
      }
    }
    const { error: ordersError } = await supabaseAdmin.from("orders").delete().eq("customer_id", customerId)
    if (ordersError) return { error: `Couldn't delete their orders: ${ordersError.message}` }
  }

  const { error: deleteError } = await supabaseAdmin.from("customers").delete().eq("id", customerId)
  if (deleteError) return { error: deleteError.message }

  // Remove the login too, otherwise the person could still sign in with the old credentials.
  if (customer.auth_id) {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(customer.auth_id as string)
    if (authError && !/not found/i.test(authError.message)) {
      revalidatePath("/admin/customers")
      return {
        error: `The profile was deleted, but their login account could not be removed (${authError.message}). Remove it in the Supabase dashboard under Authentication → Users.`,
      }
    }
  }

  revalidatePath("/admin/customers")
  revalidatePath("/admin/orders")
  redirect("/admin/customers")
}
