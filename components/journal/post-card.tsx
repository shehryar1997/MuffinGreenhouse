import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Leaf } from "lucide-react"
import type { JournalPost } from "@/types"
import { readingMinutes } from "@/lib/data/journal"
import { formatPostDate } from "@/lib/journal-format"
import { cn } from "@/lib/utils"

export function PostCard({ post, featured = false }: { post: JournalPost; featured?: boolean }) {
  return (
    <Link
      href={`/journal/${post.slug}`}
      className={cn(
        "group flex overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring",
        featured ? "flex-col lg:col-span-2 lg:flex-row" : "h-full flex-col"
      )}
    >
      <div className={cn("relative overflow-hidden bg-muted", featured ? "aspect-[16/10] lg:aspect-auto lg:min-h-[340px] lg:w-1/2" : "aspect-[16/10]")}>
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt=""
            fill
            sizes={featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 768px) 50vw, 100vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Leaf className="h-12 w-12 text-primary/30" aria-hidden />
          </div>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col p-6", featured && "justify-center lg:p-10")}>
        <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-primary">
          {featured && <span>Latest</span>}
          {post.tags.slice(0, 2).map((tag) => (
            <span key={tag} className={cn(featured && "text-muted-foreground")}>
              {featured ? `· ${tag}` : tag}
            </span>
          ))}
        </div>
        <h2 className={cn("mb-3 font-serif text-foreground transition-colors group-hover:text-primary", featured ? "text-heading-2" : "text-xl", "[overflow-wrap:anywhere]")}>
          {post.title}
        </h2>
        <p className={cn("mb-5 text-muted-foreground [overflow-wrap:anywhere]", featured ? "line-clamp-4" : "line-clamp-3 text-sm")}>{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {post.publishedAt ? formatPostDate(post.publishedAt) : ""} · {readingMinutes(post.content)} min read
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-primary">
            Read <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
}
