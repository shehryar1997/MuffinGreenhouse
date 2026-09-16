import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

interface WebhookPayload {
  table: string;
  type: "INSERT" | "UPDATE" | "DELETE";
  record?: {
    slug?: string;
    category_id?: string;
    category_slug?: string;
  };
}

export async function POST(request: NextRequest) {
  // Verify secret header
  const secret = request.headers.get("x-revalidate-secret");
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse request body
    const body = (await request.json()) as WebhookPayload;

    // Always revalidate these paths
    revalidatePath("/shop/all");
    revalidatePath("/");

    // Revalidate product detail page if slug is present
    if (body.record?.slug) {
      revalidatePath(`/shop/product/${body.record.slug}`);
    }

    // Revalidate the category listing page too -- category_slug is now a flat
    // column on products (no extra DB lookup needed), so this closes the gap
    // where deleting/editing a product left its category page stale until the
    // next 300s ISR window.
    if (body.record?.category_slug) {
      revalidatePath(`/shop/${body.record.category_slug}`);
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}