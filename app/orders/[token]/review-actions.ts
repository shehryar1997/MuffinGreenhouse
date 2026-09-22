"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { REVIEWS_CACHE_TAG } from "@/lib/cache-tags"
import { supabaseAdmin } from "@/supabase/admin-client"
import { allowHit, callerIp } from "@/lib/db-rate-limit"
import { PUBLIC_BASE_URL } from "@/lib/r2"

export type ReviewResult = { error: string } | { ok: true }

export interface ReviewInput {
  rating: number
  body: string
  /** false = post anonymously */
  showName: boolean
  name: string
  imageUrl: string | null
}

// The order's secret link (public_token) is the credential: only someone holding it can review, and only for
// items in an order that has shipped. One review per order line.
export async function submitReview(token: string, orderItemId: string, input: ReviewInput): Promise<ReviewResult> {
  if (!(await allowHit(`review:${await callerIp()}`, 10, 60 * 60))) return { error: "Too many reviews from this connection. Please try again later." }

  const rating = Math.round(Number(input.rating))
  if (!(rating >= 1 && rating <= 5)) return { error: "Choose a star rating." }
  const body = String(input.body ?? "").trim()
  if (body.length < 10) return { error: "Tell us a little more (at least 10 characters)." }
  if (body.length > 1500) return { error: "Your review is too long (1,500 characters max)." }
  const name = String(input.name ?? "").trim()
  if (input.showName && (name.length < 2 || name.length > 60)) return { error: "Enter the name to show, or choose to post anonymously." }
  const imageUrl = input.imageUrl?.trim() || null
  if (imageUrl && !imageUrl.startsWith(`${PUBLIC_BASE_URL}/reviews/`)) return { error: "That photo couldn't be attached. Try uploading it again." }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, status, customer_id, order_items(id, product_id)")
    .eq("public_token", token)
    .maybeSingle()
  if (!order) return { error: "We couldn't find that order." }
  if (order.status !== "shipped" && order.status !== "delivered") return { error: "You can review your plants once your order has shipped." }

  const item = (order.order_items as Array<{ id: string; product_id: string | null }>).find((i) => i.id === orderItemId)
  if (!item?.product_id) return { error: "That item can't be reviewed." }

  const { error } = await supabaseAdmin.from("reviews").insert({
    product_id: item.product_id,
    order_item_id: item.id,
    customer_id: order.customer_id,
    rating,
    body,
    display_name: input.showName ? name : null,
    image_url: imageUrl,
    // A real order on this site backs it: goes live immediately, badged "Verified purchase".
    verified_purchase: true,
  })
  if (error) return { error: error.code === "23505" ? "You've already reviewed this item." : "Couldn't save your review. Please try again." }

  const { data: product } = await supabaseAdmin.from("products").select("slug").eq("id", item.product_id).maybeSingle()
  revalidatePath(`/orders/${token}`)
  revalidatePath("/reviews")
  revalidateTag(REVIEWS_CACHE_TAG, { expire: 0 })
  if (product?.slug) revalidatePath(`/shop/product/${product.slug}`)
  return { ok: true }
}
