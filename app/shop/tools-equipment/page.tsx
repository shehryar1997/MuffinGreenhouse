import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import Link from "next/link"
import { ProductCard } from "@/components/ui/product-card"
import { getPaginatedProductsByCategory } from "@/lib/data/catalog"
import { getCategoryCopy } from "@/lib/data/categories"
import { generateCategoryBreadcrumb, serializeJsonLd } from "@/lib/structured-data"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const counts = await Promise.all(SECTION_SLUGS.map((slug) => getPaginatedProductsByCategory(slug, 1, 1)))
  return pageMetadata({
    title: "Plant Pots, Soil, Fertilizer & Tools",
    description: "Pots, fertilizer, planting media and plant care tools in one place. Delivered in Karachi and across Pakistan.",
    path: "/shop/tools-equipment",
    // Nothing in any of its sections yet: keep the page out of search until there is.
    noindex: counts.every((c) => c.totalCount === 0),
  })
}

// Order of the sections on the page; each slug has its own /shop/<slug> page with the full list.
const SECTION_SLUGS = ["pots", "fertilizer", "planting-media", "other-equipment"] as const

// Each section is a preview; the "View all" link goes to the category page (which paginates).
const PRODUCTS_PER_SECTION = 8

export default async function ToolsEquipmentPage() {
  const sections = await Promise.all(
    SECTION_SLUGS.map(async (slug) => {
      const [{ products, totalCount }, copy] = await Promise.all([getPaginatedProductsByCategory(slug, 1, PRODUCTS_PER_SECTION), getCategoryCopy(slug)])
      return { slug, meta: { title: copy?.title ?? slug, description: copy?.description ?? "" }, products, totalCount }
    })
  )
  const breadcrumbSchema = generateCategoryBreadcrumb("Tools & Equipment", "tools-equipment")

  return (
    <>
      <div className="bg-cream-100 min-h-screen pb-8 pt-28 lg:pt-36">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <p className="font-mono text-xs tracking-widest text-clay-500 uppercase mb-2">Everything around the plant.</p>
            <h1 className="font-serif text-4xl lg:text-5xl text-forest-900 leading-tight">Tools & Equipment</h1>
            <p className="text-forest-600 mt-2 max-w-2xl">
              Pots, fertilizer, planting media and the tools that keep your plants healthy.
            </p>
            <nav aria-label="Tools & Equipment categories" className="mt-6 flex flex-wrap gap-2">
              {sections.map(({ slug, meta }) => (
                <a
                  key={slug}
                  href={`#${slug}`}
                  className="font-mono text-xs uppercase tracking-widest text-forest-700 bg-surface border border-forest-200 rounded-full px-4 py-2 hover:border-clay-400 hover:text-clay-600 transition-colors"
                >
                  {meta.title}
                </a>
              ))}
            </nav>
          </div>

          <div className="space-y-14">
            {sections.map(({ slug, meta, products, totalCount }) => (
              <section key={slug} id={slug} aria-labelledby={`${slug}-heading`} className="scroll-mt-28 lg:scroll-mt-36">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-forest-200 pb-3">
                  <div>
                    <h2 id={`${slug}-heading`} className="font-serif text-2xl lg:text-3xl text-forest-900">{meta.title}</h2>
                    <p className="text-forest-600 mt-1 max-w-2xl">{meta.description}</p>
                  </div>
                  {totalCount > 0 && (
                    <Link href={`/shop/${slug}`} className="font-mono text-sm text-clay-600 underline shrink-0">
                      {totalCount > products.length ? `View all ${totalCount} items` : "View category"}
                    </Link>
                  )}
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-12 bg-surface rounded-lg border border-forest-200">
                    <p className="text-forest-800">Nothing in {meta.title} just yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product, i) => (
                      <ProductCard key={product.id} product={product} index={i} sizes="(max-width: 1200px) 50vw, 33vw" />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />
    </>
  )
}
