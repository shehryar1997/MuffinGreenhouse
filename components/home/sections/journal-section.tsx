"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FadeIn, AnimatedHeading } from "@/components/home/shared/animations"
import { SectionLabel } from "@/components/home/shared/section-label"
import { PostCard } from "@/components/journal/post-card"
import type { JournalPost } from "@/types"

// The latest journal posts. Shown only when at least one is published.
export function JournalSection({ posts, n }: { posts: JournalPost[]; n: string }) {
  if (posts.length === 0) return null

  return (
    <section className="border-t border-forest-200/50 bg-background py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <FadeIn>
          <SectionLabel n={n} label="From the journal" />
        </FadeIn>
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-serif text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.95] tracking-tight text-forest-950">
            <AnimatedHeading lines={["Care advice,", "without the fluff."]} />
          </h2>
          <FadeIn delay={0.2}>
            <Link
              href="/journal"
              className="group inline-flex items-center gap-3 border-b border-forest-300 pb-2 font-mono text-xs uppercase tracking-widest text-forest-800 transition-colors hover:border-clay-500 hover:text-clay-600"
            >
              Read the journal
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </FadeIn>
        </div>

        {/* One post gets the wide layout; two fill the row; three make a trio. */}
        <div className={`grid gap-6 ${posts.length === 1 ? "" : posts.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}>
          {posts.map((post, i) => (
            <FadeIn key={post.id} delay={i * 0.1}>
              <PostCard post={post} featured={posts.length === 1} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
