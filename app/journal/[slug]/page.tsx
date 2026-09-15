"use client"

import { notFound } from "next/navigation"
import { motion } from "framer-motion"
import { mockJournalPosts } from "@/data/mock-products"
import { Calendar, User, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function JournalPostPage({ params }: { params: { slug: string } }) {
  const post = mockJournalPosts.find(p => p.slug === params.slug)
  
  if (!post) return notFound()

  return (
    <div className="bg-cream-100 min-h-screen">
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[500px]">
        <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto px-4 max-w-3xl">
            <Link href="/journal" className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Journal
            </Link>
            <h1 className="font-serif text-display text-white drop-shadow-md">{post.title}</h1>
            <div className="flex items-center gap-4 mt-4 text-white/90">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-stone max-w-none"
        >
          <p className="text-xl text-forest-700 leading-relaxed mb-8 font-light">
            {post.excerpt}
          </p>
          <div className="text-forest-800 leading-relaxed space-y-4">
            <p>This is where the full article content would be displayed. For now, here's a placeholder for the complete article about {post.title.toLowerCase()}.</p>
            <p>Our goal with every article is to give you practical, honest advice that actually works in Karachi conditions. We test everything ourselves first.</p>
            <p>Have questions? Ask Muffin or WhatsApp us directly.</p>
          </div>
        </motion.div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-forest-200">
          {post.tags.map((tag: string) => (
            <span key={tag} className="px-3 py-1 bg-forest-200/50 text-forest-700 rounded-full text-sm">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
