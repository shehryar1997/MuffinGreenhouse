import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit } from "@/lib/rate-limit"
import { supabaseAdmin } from "@/supabase/admin-client"
import { toWhatsAppNumber } from "@/lib/whatsapp-link"

const schema = z.object({
  productId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email().max(254),
  whatsapp: z.string().trim().min(10).max(32),
})

// "Notify me when it's back in stock": one row per person per plant (asking again just refreshes it).
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and WhatsApp number." }, { status: 400 })
  const { productId, email } = parsed.data
  const whatsapp = toWhatsAppNumber(parsed.data.whatsapp)
  if (!whatsapp) return NextResponse.json({ error: "Enter a valid WhatsApp number, e.g. 0300 1234567." }, { status: 400 })

  const { data: product } = await supabaseAdmin.from("products").select("id").eq("id", productId).not("published_at", "is", null).maybeSingle()
  if (!product) return NextResponse.json({ error: "This plant could not be found." }, { status: 404 })

  const { data: existing } = await supabaseAdmin.from("stock_notifications").select("id").eq("product_id", productId).eq("email", email).maybeSingle()
  const { error } = existing
    ? await supabaseAdmin.from("stock_notifications").update({ whatsapp, notified_at: null }).eq("id", existing.id)
    : await supabaseAdmin.from("stock_notifications").insert({ product_id: productId, email, whatsapp })
  if (error && error.code !== "23505") {
    console.error("Stock notification failed:", error)
    return NextResponse.json({ error: "Couldn't save your request. Please try again." }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
