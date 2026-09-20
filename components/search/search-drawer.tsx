"use client"

import { useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Drawer } from "vaul"
import { X, Search, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useSearch, SearchResult } from "@/components/providers/search-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/utils"
import { sanitizeSearchTerm } from "@/lib/search-term"

// Highlight matched characters in text
function HighlightedText({ text, matches }: { text: string; matches: number[] }) {
  if (!matches.length || !text) return <>{text}</>
  
  const elements: React.ReactNode[] = []
  let lastIdx = 0
  const uniqueMatches = [...new Set(matches)].sort((a, b) => a - b)
  
  for (const matchIdx of uniqueMatches) {
    if (matchIdx >= text.length) continue
    if (matchIdx > lastIdx) {
      elements.push(<span key={`text-${lastIdx}`}>{text.slice(lastIdx, matchIdx)}</span>)
    }
    elements.push(
      <span key={`highlight-${matchIdx}`} className="bg-primary/20 text-primary font-semibold rounded-sm px-0.5">
        {text[matchIdx]}
      </span>
    )
    lastIdx = matchIdx + 1
  }
  if (lastIdx < text.length) {
    elements.push(<span key={`text-end`}>{text.slice(lastIdx)}</span>)
  }
  return <>{elements}</>
}

const POPULAR_SEARCHES = ["Monstera", "Snake Plant", "Pothos", "Fiddle Leaf", "ZZ Plant"]

export function SearchDrawer() {
  const router = useRouter()
  const { isOpen, closeSearch, query, setQuery, results, isLoading } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleClose = () => {
    closeSearch()
    setTimeout(() => setQuery(""), 300)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigateToSearchPage()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      navigateToSearchPage()
    }
  }

  const handleQuickSearch = (term: string) => {
    setQuery(term)
    inputRef.current?.focus()
  }

  const navigateToSearchPage = () => {
    const sanitizedQuery = sanitizeSearchTerm(query)
    if (sanitizedQuery) {
      router.push(`/search?q=${encodeURIComponent(sanitizedQuery)}`)
      handleClose()
    }
  }

  const hasQuery = query.trim().length > 0

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && handleClose()} direction="top">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-forest-900/25 backdrop-blur-sm z-50" onClick={handleClose} />
        <Drawer.Content className="fixed inset-x-0 top-0 z-50 bg-background flex flex-col max-h-[85vh] rounded-b-2xl shadow-2xl border-b border-border/50">
          <Drawer.Title className="sr-only">Search products</Drawer.Title>
          
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
            <div className="relative flex items-center justify-between p-5 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <Search className="w-4 h-4 text-primary" />
                </div>
                <span className="font-mono text-xs text-primary uppercase tracking-wider">Search</span>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-muted rounded-lg transition-colors group" aria-label="Close search">
                <X className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>

          <div className="p-5 border-b border-border/50 bg-card/30">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
              <Input
                ref={inputRef}
                type="search"
                placeholder="Type to find plants instantly..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-12 h-14 text-base border-primary/20 bg-background focus-visible:ring-primary/30 focus-visible:border-primary/40 rounded-xl shadow-sm"
                aria-label="Search products"
              />
              {isLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </form>
            
            {!hasQuery && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground py-1.5">Popular:</span>
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleQuickSearch(term)}
                    className="px-3 py-1.5 text-xs font-medium text-forest-600 bg-forest-50 hover:bg-forest-100 border border-forest-200/50 rounded-full transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <SearchResults results={results} query={query} onClose={handleClose} isLoading={isLoading} />
          </div>
          
          <div className="p-3 border-t border-border/50 bg-muted/30">
            <p className="text-[11px] text-center text-muted-foreground/60">
              {hasQuery ? `Press Enter to see all results for "${query}"` : 'Start typing to find plants instantly'}
            </p>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  onClose: () => void
  isLoading: boolean
}

function SearchResults({ results, query, onClose, isLoading }: SearchResultsProps) {
  const router = useRouter()
  
  if (!query.trim()) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-forest-50 flex items-center justify-center">
          <Search className="w-8 h-8 text-primary/60" />
        </div>
        <h3 className="font-serif text-lg text-foreground mb-1">Find your perfect plant</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">Search by name, category, or try our popular suggestions above</p>
        <div className="mt-6 flex justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-muted rounded border border-border/50">esc</kbd> to close</span>
          <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-muted rounded border border-border/50">?K</kbd> to search</span>
        </div>
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-3">
              <div className="w-16 h-16 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1 flex flex-col justify-center gap-2">
                <div className="w-32 h-4 bg-muted rounded animate-pulse" />
                <div className="w-20 h-3 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Search className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="font-serif text-lg text-foreground mb-1">No plants found</h3>
        <p className="text-sm text-muted-foreground mb-6">Try searching for something else or browse our collections</p>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline" className="border-foreground/20 hover:bg-foreground hover:text-background transition-colors" onClick={onClose}>
            <Link href="/shop/all">
              Browse All <ArrowRight className="w-3 h-3 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          Found <span className="font-semibold text-foreground">{results.length}</span> results
        </span>
      </div>
      
      <motion.div className="space-y-1" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.03 } } }}>
        <AnimatePresence mode="popLayout">
          {results.map((product) => (
            <motion.div key={product.id} layout variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.2 }}>
              <Link href={`/shop/product/${product.slug}`} onClick={onClose} className="flex gap-4 p-3 -mx-2 hover:bg-primary/5 rounded-xl transition-all group">
                <div className="relative w-16 h-16 bg-muted shrink-0 rounded-lg overflow-hidden">
                  <Image src={product.primary_image || "/placeholder-plant.png"} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="font-serif text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    <HighlightedText text={product.name} matches={product.nameMatches} />
                  </h3>
                  {product.category_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <HighlightedText text={product.category_name} matches={product.categoryMatches} />
                    </p>
                  )}
                  <p className="font-mono text-sm font-medium text-foreground mt-1.5">{formatPrice(product.price)}</p>
                </div>
                <div className="flex items-center">
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-4 pt-4 border-t border-border/50">
        <Button variant="ghost" className="w-full h-12 text-sm hover:bg-primary/5 group" onClick={() => {
          const sanitizedQuery = sanitizeSearchTerm(query)
          if (sanitizedQuery) {
            router.push(`/search?q=${encodeURIComponent(sanitizedQuery)}`)
            onClose()
          }
        }}>
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">See all results for &ldquo;{query}&rdquo;</span>
          <ArrowRight className="w-4 h-4 ml-2 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </Button>
      </motion.div>
    </div>
  )
}
