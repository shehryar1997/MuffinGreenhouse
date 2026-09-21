import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { Badge, EmptyState, PageHeader, StatStrip, buttonClass, rowLinkClass } from "../_components/ui"
import { DeleteButton } from "../_components/delete-button"
import { fmtNumber } from "../_components/format"
import { deleteReview, setReviewHidden } from "./actions"

export const dynamic = "force-dynamic"

interface Row {
  id: string
  rating: number
  body: string
  display_name: string | null
  image_url: string | null
  is_hidden: boolean
  created_at: string
  product: { id: string; name: string } | null
}

export default async function AdminReviewsPage() {
  await requireAdmin()

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("id, rating, body, display_name, image_url, is_hidden, created_at, product:products(id, name)")
    .order("created_at", { ascending: false })
    .limit(300)
  if (error) console.error("Error loading reviews:", error)
  const rows = (data ?? []) as unknown as Row[]

  const visible = rows.filter((r) => !r.is_hidden)
  const average = visible.length > 0 ? visible.reduce((s, r) => s + r.rating, 0) / visible.length : 0

  return (
    <div>
      <PageHeader title="Reviews" description="Reviews from customers whose order has shipped. They go live straight away; hide one to take it off the site." />

      <StatStrip
        items={[
          { label: "Reviews live", value: fmtNumber(visible.length) },
          { label: "Average rating", value: visible.length > 0 ? average.toFixed(1) : "-" },
          { label: "With photos", value: fmtNumber(visible.filter((r) => r.image_url).length) },
        ]}
      />

      <div className="mt-8">
        {rows.length === 0 ? (
          <EmptyState title="No reviews yet" description="Customers can review an item from their order page once it has shipped." />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap gap-4 px-5 py-4">
                {r.image_url && (
                  <a href={r.image_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <Image src={r.image_url} alt="Review photo" width={72} height={72} className="h-[72px] w-[72px] rounded-md object-cover" />
                  </a>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex text-amber-500" role="img" aria-label={`${r.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-current" : "text-border"}`} aria-hidden />
                      ))}
                    </span>
                    {r.product && (
                      <Link href={`/admin/products/${r.product.id}/edit`} className={rowLinkClass}>
                        {r.product.name}
                      </Link>
                    )}
                    {r.is_hidden && <Badge tone="neutral">Hidden</Badge>}
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-foreground">{r.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.display_name ?? "Anonymous"} · {new Date(r.created_at).toLocaleDateString("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" })}
                  </p>
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  <form action={setReviewHidden.bind(null, r.id, !r.is_hidden)}>
                    <button type="submit" className={buttonClass({ variant: "secondary", size: "sm" })}>
                      {r.is_hidden ? "Show" : "Hide"}
                    </button>
                  </form>
                  <DeleteButton
                    title="Delete this review?"
                    description="It will be removed for good. To take it off the site but keep it, hide it instead."
                    action={deleteReview.bind(null, r.id)}
                    fallbackError="Couldn't delete the review. Check your connection and try again."
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
