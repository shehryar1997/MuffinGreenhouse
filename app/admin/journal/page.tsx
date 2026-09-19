import Link from "next/link"
import { ExternalLink, Plus, Star } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { formatPostDate } from "@/lib/journal-format"
import { nowMs } from "@/lib/now"

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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-neutral-900">Journal</h1>
          <p className="text-neutral-500 mt-1">Care guides and stories. Drafts stay hidden until you publish them.</p>
        </div>
        <Link href="/admin/journal/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#E85D2C] text-white rounded-lg hover:bg-[#d45124] text-sm font-medium shrink-0">
          <Plus className="h-4 w-4" aria-hidden />
          New post
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(
          [
            { key: "published", label: `Published (${groups.published.length})` },
            { key: "drafts", label: `Drafts (${groups.drafts.length})` },
          ] as const
        ).map((t) => (
          <Link
            key={t.key}
            href={t.key === "published" ? "/admin/journal" : "/admin/journal?tab=drafts"}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.key ? "bg-[#E85D2C] text-white" : "bg-white border text-neutral-600 hover:bg-neutral-50"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium text-neutral-900">{tab === "published" ? "Nothing published yet" : "No drafts"}</p>
          <p className="text-sm text-neutral-500 mt-1">
            {tab === "published" ? "Until you publish a post, customers see a “first stories are on their way” message on the journal page." : "Nothing to show here."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-neutral-50 text-left text-sm font-medium text-neutral-600">
              <tr>
                <th className="px-4 py-3">Post</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {shown.map((r) => {
                const s = state(r, now)
                return (
                  <tr key={r.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/journal/${r.id}/edit`} className="font-medium text-neutral-900 hover:text-[#E85D2C] inline-flex items-center gap-1.5">
                        {r.title}
                        {r.is_featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-label="Featured" />}
                      </Link>
                      <p className="text-xs text-neutral-500">
                        {r.author}
                        {r.tags && r.tags.length > 0 ? ` · ${r.tags.join(", ")}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          s === "live" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : s === "scheduled" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {s === "live" ? "Live" : s === "scheduled" ? "Scheduled" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{r.published_at ? formatPostDate(r.published_at) : "Not published"}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {s === "live" && (
                        <Link href={`/journal/${r.slug}`} target="_blank" className="text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1 mr-4">
                          View <ExternalLink className="h-3 w-3" aria-hidden />
                        </Link>
                      )}
                      <Link href={`/admin/journal/${r.id}/edit`} className="text-[#E85D2C] hover:underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
