import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, MessageCircle } from "lucide-react"
import { getJournalPostBySlug, getPublishedPosts, readingMinutes } from "@/lib/data/journal"
import { formatPostDate } from "@/lib/journal-format"
import { serializeJsonLd } from "@/lib/structured-data"
import { Markdown } from "@/components/journal/markdown"
import { PostCard } from "@/components/journal/post-card"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/nav.config"

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getJournalPostBySlug(slug)
  if (!post) return { title: "Post not found" }
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    alternates: { canonical: `/journal/${slug}` },
    openGraph: {
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      authors: [post.author],
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  }
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post, all] = await Promise.all([getJournalPostBySlug(slug), getPublishedPosts()])
  if (!post) notFound()

  // Prefer posts that share a tag; fall back to the newest others.
  const others = all.filter((p) => p.id !== post.id)
  const related = [...others.filter((p) => p.tags.some((t) => post.tags.includes(t))), ...others.filter((p) => !p.tags.some((t) => post.tags.includes(t)))].slice(0, 2)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: "Muffin Greenhouse" },
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.coverImage ? { image: [post.coverImage] } : {}),
  }

  return (
    <article className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <div className="container mx-auto max-w-3xl px-4 pb-16 pt-24 sm:px-6 lg:pt-28">
        <Link
          href="/journal"
          className="mb-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          The Journal
        </Link>

        {post.tags.length > 0 && (
          <p className="mb-3 font-mono text-xs lg:text-[11px] uppercase tracking-widest text-primary">{post.tags.join(" · ")}</p>
        )}
        <h1 className="mb-5 font-serif text-display text-foreground [overflow-wrap:anywhere]">{post.title}</h1>
        <p className="mb-6 text-xl font-light leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{post.excerpt}</p>
        <p className="mb-10 text-sm text-muted-foreground">
          By {post.author}
          {post.publishedAt && <> · {formatPostDate(post.publishedAt)}</>} · {readingMinutes(post.content)} min read
        </p>

        {post.coverImage && (
          <div className="relative mb-12 aspect-[16/9] overflow-hidden rounded-3xl bg-muted">
            <Image src={post.coverImage} alt="" fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
          </div>
        )}

        <div className="journal-prose">
          <Markdown source={post.content} />
        </div>

        <aside className="mt-14 rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
          <p className="mb-2 font-serif text-xl text-foreground">Got a question about your plant?</p>
          <p className="mb-5 text-sm text-muted-foreground">Send us a photo and we&apos;ll help you figure it out.</p>
          <Button asChild>
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi Muffin! I just read "${post.title}" and have a question.`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
              Ask on WhatsApp
            </a>
          </Button>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="border-t border-border" aria-labelledby="keep-reading">
          <div className="container mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <h2 id="keep-reading" className="mb-6 font-serif text-heading-2 text-foreground">
              Keep reading
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
