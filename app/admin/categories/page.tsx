import Link from "next/link"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { Alert, Badge, ButtonLink, PageHeader, TableShell, Td, Th, Thead, Tr, rowLinkClass } from "../_components/ui"
import { fmtNumber } from "../_components/format"

export const dynamic = "force-dynamic"

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin()
  const { saved } = await searchParams
  const [{ data: categories, error }, { data: products }] = await Promise.all([
    supabaseAdmin.from("categories").select("id, slug, name, tagline, description, intro, meta_title, meta_description").order("sort_order"),
    supabaseAdmin.from("products").select("category_slug, published_at"),
  ])
  const live = new Map<string, number>()
  for (const p of products ?? []) if (p.published_at) live.set(p.category_slug as string, (live.get(p.category_slug as string) ?? 0) + 1)

  return (
    <div>
      <PageHeader
        title="Categories"
        description="The text on each category page and how it appears on Google. A buying guide of 150-300 words helps a category page rank."
      />
      {saved && <Alert tone="success" className="mb-6" title="Category saved. The shop shows the new text now." />}
      {error && <Alert tone="danger" className="mb-6" title="Couldn't load categories">{error.message}</Alert>}
      <TableShell minWidth="min-w-[760px]">
        <Thead>
          <tr>
            <Th>Category</Th>
            <Th align="right">Live products</Th>
            <Th>Buying guide</Th>
            <Th>Search listing</Th>
            <Th />
          </tr>
        </Thead>
        <tbody>
          {(categories ?? []).map((c) => {
            const words = ((c.intro as string | null) ?? "").split(/\s+/).filter(Boolean).length
            return (
              <Tr key={c.id as string}>
                <Td>
                  <Link href={`/admin/categories/${c.slug}`} className={rowLinkClass}>{c.name as string}</Link>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">/shop/{c.slug as string}</p>
                </Td>
                <Td align="right" className="tabular-nums">{fmtNumber(live.get(c.slug as string) ?? 0)}</Td>
                <Td>{words === 0 ? <Badge tone="warning">Not written</Badge> : <span className="tabular-nums text-foreground/80">{words} words</span>}</Td>
                <Td>{c.meta_title && c.meta_description ? <Badge tone="success">Set</Badge> : <Badge tone="warning">Missing</Badge>}</Td>
                <Td align="right">
                  <ButtonLink href={`/admin/categories/${c.slug}`} size="sm">Edit</ButtonLink>
                </Td>
              </Tr>
            )
          })}
        </tbody>
      </TableShell>
    </div>
  )
}
