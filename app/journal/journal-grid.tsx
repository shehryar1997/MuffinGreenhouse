"use client"

import { motion } from "framer-motion"
import { ArrowRight, Calendar } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { JournalPost } from "@/types"

interface JournalGridProps {
  posts: JournalPost[]
}

export default function JournalGrid({ posts }: JournalGridProps) {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {posts.map((post) => (
        <Link key={post.id} href={`/journal/${post.slug}`}>
          <motion.article
            whileHover={{ y: -4 }}
            className="bg-cream-200 rounded-2xl overflow-hidden group"
          >
            <div className="relative h-56 overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                {post.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
              <h2 className="font-serif text-xl text-forest-900 mb-2 group-hover:text-clay-500 transition-colors">
                {post.title}
              </h2>
              <p className="text-forest-600 text-sm mb-4">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-forest-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1 text-clay-500 font-medium text-sm">
                  <span>Read</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </motion.article>
        </Link>
      ))}
    </div>
  )
}
