import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit } from "@/lib/rate-limit"
import { resolveCoupon } from "@/lib/coupons"

const schema = z.object({
  code: z.string().trim().min(1).max(40),
  email: z.string().trim().max(254).nullish(),
  items: z
    .array(z.object({ productId: z.string().uuid(), variantId: z.string().uuid().nullish(), quantity: z.number().int().min(1).max(99) }))
    .min(1)
    .max(50),
})

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Enter a coupon code." }, { status: 400 })

  const result = await resolveCoupon(parsed.data.code, parsed.data.items, parsed.data.email)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json(result)
}
