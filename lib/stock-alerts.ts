// SERVER-ONLY. "Back in stock" and "price drop" e-mails.
//  * People who asked to be told (stock_notifications) get a back-in-stock e-mail once.
//  * People who saved the plant on their wishlist get back-in-stock and price-drop e-mails.
// Triggered when the admin saves a product, and swept daily (a cancelled order can also put stock back).
import { supabaseAdmin } from "@/supabase/admin-client"
import { isPlaceholderEmail } from "@/lib/manual-order"
import { sendBackInStockEmail, sendPriceDropEmail } from "@/lib/email/send-growth-emails"

interface ProductRow {
  id: string
  name: string
  slug: string
  price: number
  stock_status: string
  published_at: string | null
}

const PRODUCT_COLUMNS = "id, name, slug, price, stock_status, published_at"

async function getProduct(productId: string): Promise<ProductRow | null> {
  const { data } = await supabaseAdmin.from("products").select(PRODUCT_COLUMNS).eq("id", productId).maybeSingle()
  return (data as ProductRow | null) ?? null
}

/** E-mails of customers who have this product on their wishlist (real addresses only). */
async function wishlistEmails(productId: string): Promise<string[]> {
  const { data } = await supabaseAdmin.from("wishlist_items").select("customer:customers(email)").eq("product_id", productId)
  const emails = (data ?? [])
    .map((row) => (row.customer as unknown as { email: string | null } | null)?.email?.toLowerCase())
    .filter((email): email is string => !!email && !isPlaceholderEmail(email))
  return [...new Set(emails)]
}

/** Sends back-in-stock e-mails for one product. A failed send stays pending and is retried by the daily sweep. */
export async function sendRestockAlerts(productId: string, opts: { includeWishlist: boolean }): Promise<void> {
  const product = await getProduct(productId)
  if (!product || !product.published_at || product.stock_status === "out_of_stock") return

  const alreadyEmailed = new Set<string>()
  const mail = (toEmail: string) => sendBackInStockEmail({ toEmail, productName: product.name, slug: product.slug, price: Number(product.price) })

  const { data: pending } = await supabaseAdmin.from("stock_notifications").select("id, email").eq("product_id", productId).is("notified_at", null)
  for (const request of pending ?? []) {
    try {
      await mail(request.email)
      await supabaseAdmin.from("stock_notifications").update({ notified_at: new Date().toISOString() }).eq("id", request.id)
      alreadyEmailed.add(request.email.toLowerCase())
    } catch (err) {
      console.error("Back-in-stock e-mail failed:", request.email, err)
    }
  }

  if (!opts.includeWishlist) return
  for (const email of await wishlistEmails(productId)) {
    if (alreadyEmailed.has(email)) continue
    try {
      await mail(email)
    } catch (err) {
      console.error("Wishlist back-in-stock e-mail failed:", email, err)
    }
  }
}

export async function sendPriceDropAlerts(productId: string, oldPrice: number): Promise<void> {
  const product = await getProduct(productId)
  if (!product || !product.published_at || Number(product.price) >= oldPrice) return
  for (const email of await wishlistEmails(productId)) {
    try {
      await sendPriceDropEmail({ toEmail: email, productName: product.name, slug: product.slug, oldPrice, newPrice: Number(product.price) })
    } catch (err) {
      console.error("Price-drop e-mail failed:", email, err)
    }
  }
}

/** Call after an admin saves a product, with the price/stock it had BEFORE the save. */
export async function afterProductSaved(productId: string, before: { price: number; stock_status: string }): Promise<void> {
  const after = await getProduct(productId)
  if (!after || !after.published_at) return
  const nowInStock = after.stock_status !== "out_of_stock"
  const wasOut = before.stock_status === "out_of_stock"

  if (nowInStock) await sendRestockAlerts(productId, { includeWishlist: wasOut })
  if (nowInStock && Number(after.price) < Number(before.price)) await sendPriceDropAlerts(productId, Number(before.price))
}

/** Daily safety net: anything still waiting whose product is in stock again (e.g. stock returned by a cancelled order). */
export async function sweepRestockAlerts(): Promise<number> {
  const { data } = await supabaseAdmin.from("stock_notifications").select("product_id").is("notified_at", null).limit(500)
  const ids = [...new Set((data ?? []).map((row) => row.product_id as string))]
  for (const id of ids) await sendRestockAlerts(id, { includeWishlist: false })
  return ids.length
}
