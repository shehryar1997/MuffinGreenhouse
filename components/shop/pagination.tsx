"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
}

function buildPageHref(pathname: string, searchParams: URLSearchParams, page: number): string {
  const params = new URLSearchParams(searchParams.toString())
  if (page <= 1) {
    params.delete("page")
  } else {
    params.set("page", String(page))
  }
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

// Windowed page list: first, last, and a small range around the current page,
// with "ellipsis" markers filling the gaps so long catalogs don't render a
// button per page.
function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  const pages = new Set<number>([1, total])
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= total) pages.add(p)
  }
  const sorted = Array.from(pages).sort((a, b) => a - b)

  const result: (number | "ellipsis")[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis")
    result.push(p)
    prev = p
  }
  return result
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  const pageNumbers = getPageNumbers(currentPage, totalPages)
  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= totalPages

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-10">
      {isFirstPage ? (
        <span className="flex items-center gap-1 px-3 py-2 rounded-lg border border-forest-100 text-forest-300 font-mono text-sm cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </span>
      ) : (
        <Link
          href={buildPageHref(pathname, searchParams, currentPage - 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-forest-200 text-forest-700 font-mono text-sm hover:bg-forest-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </Link>
      )}

      <div className="flex items-center gap-1">
        {pageNumbers.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-forest-400 font-mono text-sm">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildPageHref(pathname, searchParams, p)}
              aria-current={p === currentPage ? "page" : undefined}
              className={`min-w-[2.25rem] text-center px-3 py-2 rounded-lg font-mono text-sm transition-colors ${
                p === currentPage
                  ? "bg-clay-500 text-white"
                  : "border border-forest-200 text-forest-700 hover:bg-forest-50"
              }`}
            >
              {p}
            </Link>
          )
        )}
      </div>

      {isLastPage ? (
        <span className="flex items-center gap-1 px-3 py-2 rounded-lg border border-forest-100 text-forest-300 font-mono text-sm cursor-not-allowed">
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      ) : (
        <Link
          href={buildPageHref(pathname, searchParams, currentPage + 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-forest-200 text-forest-700 font-mono text-sm hover:bg-forest-50 transition-colors"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </nav>
  )
}
