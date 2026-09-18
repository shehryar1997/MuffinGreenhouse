import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

interface WebhookPayload {
  table: string;
  type: "INSERT" | "UPDATE" | "DELETE";
  record?: {
    slug?: string;
    category_id?: string;
    category_slug?: string;
    use_case_tags?: string[];
  };
}

// Map use case labels to slugs (matches USE_CASE_SLUG_TO_LABEL in lib/data/products.ts)
const USE_CASE_LABEL_TO_SLUG: Record<string, string> = {
  "Low-Light Survivors": "low-light-survivors",
  "Balcony & Rooftop": "balcony-rooftop",
  "Air-Purifying": "air-purifying",
  "Pet-Safe": "pet-safe",
  "Beginner-Proof": "beginner-proof",
  "Statement Plants": "statement-plants",
};

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

    // Revalidate shop-by-need pages if use_case_tags changed
    if (body.record?.use_case_tags && Array.isArray(body.record.use_case_tags)) {
      // Convert tags to slugs and revalidate each matching shop-by-need page
      body.record.use_case_tags.forEach((tag) => {
        const slug = USE_CASE_LABEL_TO_SLUG[tag];
        if (slug) {
          revalidatePath(`/shop-by-need/${slug}`);
        }
      });
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}