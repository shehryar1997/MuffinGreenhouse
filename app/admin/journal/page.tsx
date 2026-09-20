import Link from "next/link"
import { ExternalLink, Plus, Star } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { formatPostDate } from "@/lib/journal-format"
import { nowMs } from "@/lib/now"
import { Badge, ButtonLink, EmptyState, FilterTabs, PageHeader, TableShell, Td, Th, Thead, Tr, rowLinkClass, type Tone } from "../_components/ui"

export const dynamic = "force-dynamic"

interface Row {
  id: string
  slug: string
  title: string
  author: string
  tags: string[] | null
  is_featured: boolean
  published_at: string | null
  updated_at: string | null
}

type Tab = "published" | "drafts"

function state(row: Row, now: number): "draft" | "scheduled" | "live" {
  if (!row.published_at) return "draft"
  return new Date(row.published_at).getTime() > now ? "scheduled" : "live"
}

const STATE_BADGE: Record<ReturnType<typeof state>, { label: string; tone: Tone }> = {
  live: { label: "Live", tone: "success" },
  scheduled: { label: "Scheduled", tone: "info" },
  draft: { label: "Draft", tone: "neutral" },
}

export default async function AdminJournalPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin()
  const { tab: rawTab } = await searchParams
  const tab: Tab = rawTab === "drafts" ? "drafts" : "published"

  const { data, error } = await supabaseAdmin
    .from("journal_posts")
    .select("id, slug, title, author, tags, is_featured, published_at, updated_at")
    .order("updated_at", { ascending: false })
  if (error) console.error("Error loading journal posts:", error)

  const now = nowMs()
  const rows = (data ?? []) as unknown as Row[]
  const groups = {
    published: rows.filter((r) => state(r, now) !== "draft"),
    drafts: rows.filter((r) => state(r, now) === "draft"),
  }
  const shown = groups[tab]

  return (
    <div>
      <PageHeader
        title="Journal"
        description="Care guides and stories. Drafts stay hidden until you publish them."
        actions={
          <ButtonLink href="/admin/journal/new" variant="primary">
            <Plus className="h-4 w-4" aria-hidden />
            New post
          </ButtonLink>
        }
      />

      <div className="mb-4">
        <FilterTabs
          label="Journal posts"
          items={[
            { href: "/admin/journal", label: "Published", count: groups.published.length, active: tab === "published" },
            { href: "/admin/journal?tab=drafts", label: "Drafts", count: groups.drafts.length, active: tab === "drafts" },
          ]}
        />
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title={tab === "published" ? "Nothing published yet" : "No drafts"}
          description={
            tab === "published"
              ? "Until you publish a post, customers see a “first stories are on their way” message on the journal page."
              : "Posts you save without publishing collect here."
          }
        />
      ) : (
        <TableShell minWidth="min-w-[680px]">
          <Thead>
            <tr>
              <Th>Post</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th />
            </tr>
          </Thead>
          <tbody>
            {shown.map((r) => {
              const s = state(r, now)
              const badge = STATE_BADGE[s]
              return (
                <Tr key={r.id}>
                  <Td>
                    <Link href={`/admin/journal/${r.id}/edit`} className={`${rowLinkClass} inline-flex items-center gap-1.5`}>
                      {r.title}
                      {r.is_featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-label="Featured" />}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.author}
                      {r.tags && r.tags.length > 0 ? ` · ${r.tags.join(", ")}` : ""}
                    </p>
                  </Td>
                  <Td>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{r.published_at ? formatPostDate(r.published_at) : "Not published"}</Td>
                  <Td align="right" className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {s === "live" && (
                        <ButtonLink href={`/journal/${r.slug}`} target="_blank" size="sm" variant="ghost">
                          View <ExternalLink className="h-3 w-3" aria-hidden />
                        </ButtonLink>
                      )}
                      <ButtonLink href={`/admin/journal/${r.id}/edit`} size="sm">
                        Edit
                      </ButtonLink>
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  )
}
