import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen, MessageCircle } from "lucide-react"
import { getPublishedPosts } from "@/lib/data/journal"
import { PostCard } from "@/components/journal/post-card"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/nav.config"

export const revalidate = 60

export const metadata: Metadata = {
  title: "The Journal: Plant Care Guides & Stories",
  description: "Plant care guides, propagation notes and honest stories from the Muffin Greenhouse, written for Karachi homes and Pakistani climates.",
  alternates: { canonical: "/journal" },
}

export default async function JournalPage() {
  const posts = await getPublishedPosts()
  // An explicitly featured post leads; otherwise the newest one does.
  const lead = posts.find((p) => p.isFeatured) ?? posts[0]
  const rest = posts.filter((p) => p.id !== lead?.id)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:pt-32">
        <header className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">Stories</p>
          <h1 className="mb-4 font-serif text-display text-foreground">The Journal</h1>
          <p className="text-body-lg text-muted-foreground">Guides, propagation notes and honest stories from the greenhouse.</p>
        </header>

        {lead ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <PostCard post={lead} featured />
            {rest.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <section className="mx-auto max-w-xl rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center sm:px-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-7 w-7 text-primary" aria-hidden />
            </div>
            <h2 className="mb-3 font-serif text-heading-2 text-foreground">The first stories are on their way</h2>
            <p className="mb-8 text-muted-foreground">
              We&apos;re writing our first care guides and greenhouse notes. Until then, ask us anything about your plants and we&apos;ll answer personally.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Hi Muffin! I have a plant care question.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
                  Ask us on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link href="/shop/all">Browse the plants</Link>
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
