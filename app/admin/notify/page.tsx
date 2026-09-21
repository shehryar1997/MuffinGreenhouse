import Link from "next/link"
import { ChevronRight, MessageCircle } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { whatsAppLink } from "@/lib/whatsapp-link"
import { Badge, EmptyState, PageHeader, StatStrip, buttonClass, rowLinkClass } from "../_components/ui"
import { fmtNumber } from "../_components/format"

export const dynamic = "force-dynamic"

interface Row {
  id: string
  email: string
  whatsapp: string
  notified_at: string | null
  created_at: string
  product: { id: string; name: string; slug: string; stock_status: string } | null
}

interface Person {
  email: string
  whatsapp: string
  latest: string
  rows: Row[]
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" })

export default async function AdminNotifyPage() {
  await requireAdmin()

  const { data, error } = await supabaseAdmin
    .from("stock_notifications")
    .select("id, email, whatsapp, notified_at, created_at, product:products(id, name, slug, stock_status)")
    .order("created_at", { ascending: false })
    .limit(3000)
  if (error) console.error("Error loading stock notifications:", error)
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.product)

  // One line per customer (by e-mail), however many plants they asked about.
  const byEmail = new Map<string, Person>()
  for (const row of rows) {
    const key = row.email.toLowerCase()
    const person = byEmail.get(key)
    if (person) person.rows.push(row)
    else byEmail.set(key, { email: row.email, whatsapp: row.whatsapp, latest: row.created_at, rows: [row] })
  }
  const people = [...byEmail.values()]

  const waiting = (r: Row) => !r.notified_at
  const peopleWaiting = people.filter((p) => p.rows.some(waiting)).length
  const plantsRequested = new Set(rows.map((r) => r.product!.id)).size
  const readyToTell = rows.filter((r) => waiting(r) && r.product!.stock_status !== "out_of_stock").length

  return (
    <div>
      <PageHeader
        title="Notify list"
        description="People who asked to be told when a sold-out plant is back. Open a customer to see every plant they're waiting for. E-mails go out automatically when you restock."
      />

      <StatStrip
        items={[
          { label: "People waiting", value: fmtNumber(peopleWaiting) },
          { label: "Plants requested", value: fmtNumber(plantsRequested) },
          {
            label: "In stock, not yet e-mailed",
            value: fmtNumber(readyToTell),
            hint: readyToTell > 0 ? "Sent on the next save or the daily sweep" : undefined,
            warn: readyToTell > 0,
          },
        ]}
      />

      <div className="mt-8">
        {people.length === 0 ? (
          <EmptyState title="Nobody is waiting" description="When a customer taps “Notify me” on a sold-out plant, they appear here." />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {people.map((p) => {
              const pending = p.rows.filter(waiting).length
              return (
                <li key={p.email}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-3.5 hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="break-all font-medium text-foreground">{p.email}</p>
                        <p className="text-[13px] text-muted-foreground">
                          {p.whatsapp} · last request {day(p.latest)}
                        </p>
                      </div>
                      <span className="shrink-0 text-right text-[13px] text-muted-foreground">
                        <span className="text-base font-semibold tabular-nums text-foreground">{p.rows.length}</span> {p.rows.length === 1 ? "plant" : "plants"}
                        {pending < p.rows.length && <span className="block">{pending} still waiting</span>}
                      </span>
                    </summary>
                    <div className="border-t border-border bg-muted/20 px-5 py-3">
                      <ul className="divide-y divide-border">
                        {p.rows.map((r) => {
                          const inStock = r.product!.stock_status !== "out_of_stock"
                          const link = whatsAppLink(p.whatsapp, `Hi! Muffin Plants here. ${r.product!.name} is back in stock: https://www.muffinplants.com/shop/product/${r.product!.slug}`)
                          return (
                            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
                              <div className="min-w-0 flex-1">
                                <Link href={`/admin/products/${r.product!.id}/edit`} className={rowLinkClass}>
                                  {r.product!.name}
                                </Link>
                                <p className="text-xs text-muted-foreground">Asked {day(r.created_at)}</p>
                              </div>
                              {r.notified_at ? (
                                <Badge tone="success">E-mailed {day(r.notified_at)}</Badge>
                              ) : inStock ? (
                                <Badge tone="warning">In stock, not e-mailed yet</Badge>
                              ) : (
                                <Badge tone="neutral">Still sold out</Badge>
                              )}
                              {inStock && link && (
                                <a href={link} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: "secondary", size: "sm" })}>
                                  <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                                  WhatsApp
                                </a>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </details>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
