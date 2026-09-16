import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

interface WebhookPayload {
  table: string;
  type: "INSERT" | "UPDATE" | "DELETE";
  record?: {
    slug?: string;
    category_id?: string;
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

    // Note: Category-specific paths are not revalidated here because
    // resolving category_slug from category_id would require an extra
    // database query. The /shop/all revalidation covers category listings.

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
