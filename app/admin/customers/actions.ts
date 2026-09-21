"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { BAD_BULK_REQUEST, cleanBulkIds, type BulkDeleteResult } from "@/lib/admin-bulk"

export type CustomerActionResult = { error: string } | undefined

/**
 * Permanently deletes a customer profile: the customers row, their saved addresses and
 * wishlist (both cascade), and their website login (Supabase Auth user).
 *
 * Orders are financial records and are protected: a customer who has orders can only be
 * deleted with `deleteOrders = true`, which also deletes those orders (and their line items).
 * That removes them from revenue totals and does NOT return their stock.
 */
// `profileDeleted` is true when the customer row is gone even though `error` is set (the login couldn't be removed).
async function removeCustomer(
  customerId: string,
  deleteOrders: boolean
): Promise<{ error: string; profileDeleted: boolean } | undefined> {
  const { data: customer, error: readError } = await supabaseAdmin
    .from("customers")
    .select("id, email, auth_id")
    .eq("id", customerId)
    .maybeSingle()
  if (readError) return { error: readError.message, profileDeleted: false }
  if (!customer) return { error: "This customer no longer exists.", profileDeleted: false }

  const { count: orderCount, error: countError } = await supabaseAdmin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
  if (countError) return { error: countError.message, profileDeleted: false }

  if ((orderCount ?? 0) > 0) {
    if (!deleteOrders) {
      return {
        error: `${customer.email} has ${orderCount} order${orderCount === 1 ? "" : "s"}. Orders are financial records, so the profile can only be deleted together with them.`,
        profileDeleted: false,
      }
    }
    const { error: ordersError } = await supabaseAdmin.from("orders").delete().eq("customer_id", customerId)
    if (ordersError) return { error: `Couldn't delete their orders: ${ordersError.message}`, profileDeleted: false }
  }

  const { error: deleteError } = await supabaseAdmin.from("customers").delete().eq("id", customerId)
  if (deleteError) return { error: deleteError.message, profileDeleted: false }

  // Remove the login too, otherwise the person could still sign in with the old credentials.
  if (customer.auth_id) {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(customer.auth_id as string)
    if (authError && !/not found/i.test(authError.message)) {
      return {
        error: `The profile was deleted, but their login account could not be removed (${authError.message}). Remove it in the Supabase dashboard under Authentication → Users.`,
        profileDeleted: true,
      }
    }
  }
}

export async function deleteCustomer(customerId: string, deleteOrders: boolean): Promise<CustomerActionResult> {
  await requireAdmin()
  const failed = await removeCustomer(customerId, deleteOrders)
  if (failed) {
    if (failed.profileDeleted) revalidatePath("/admin/customers")
    return { error: failed.error }
  }

  revalidatePath("/admin/customers")
  revalidatePath("/admin/orders")
  redirect("/admin/customers")
}

// "Delete selected" on the customers list. The list's dialog warns that customers with orders are deleted together
// with those orders (same as the single delete's second step), so this always passes deleteOrders = true.
export async function deleteCustomers(ids: string[]): Promise<BulkDeleteResult> {
  await requireAdmin()
  const clean = cleanBulkIds(ids)
  if (!clean) return BAD_BULK_REQUEST

  const { data: named } = await supabaseAdmin.from("customers").select("id, email").in("id", clean)
  const emailOf = new Map((named ?? []).map((c) => [c.id as string, c.email as string]))

  const result: BulkDeleteResult = { deleted: 0, failures: [] }
  for (const id of clean) {
    const failed = await removeCustomer(id, true)
    if (failed?.profileDeleted) result.deleted += 1
    if (failed) result.failures.push(`${emailOf.get(id) ?? "A customer"}: ${failed.error}`)
    else result.deleted += 1
  }

  if (result.deleted > 0 || result.failures.length > 0) {
    revalidatePath("/admin/customers")
    revalidatePath("/admin/orders")
  }
  return result
}
