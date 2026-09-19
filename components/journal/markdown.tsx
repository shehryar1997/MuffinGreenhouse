import * as React from "react"

// A small, dependency-free renderer for journal posts. It builds React elements (never raw HTML),
// so post content can't inject markup or script no matter what is typed into the admin editor.
//
// Supported: # / ## / ### headings, paragraphs, - or * bullet lists, 1. numbered lists, > quotes,
// --- rules, ![alt](https://image) images, and inline **bold**, *italic*, `code`, [links](url).

const SAFE_HREF = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i
const SAFE_IMAGE = /^https:\/\//i

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g
  let last = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const token = match[0]
    const key = `${keyPrefix}-${i++}`
    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded bg-muted px-1.5 py-0.5 text-[0.9em]">
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith("[")) {
      const linkMatch = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token)
      if (linkMatch && SAFE_HREF.test(linkMatch[2])) {
        const external = /^https?:\/\//i.test(linkMatch[2])
        nodes.push(
          <a
            key={key}
            href={linkMatch[2]}
            className="text-primary underline underline-offset-2 hover:no-underline"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {linkMatch[1]}
          </a>
        )
      } else {
        nodes.push(token)
      }
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>)
    }
    last = match.index + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n")
  const blocks: React.ReactNode[] = []
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let quote: string[] = []
  let key = 0

  const flushParagraph = () => {
    if (paragraph.length) {
      const k = key++
      blocks.push(<p key={k}>{renderInline(paragraph.join(" "), `p${k}`)}</p>)
      paragraph = []
    }
  }
  const flushList = () => {
    if (list) {
      const k = key++
      const items = list.items.map((item, i) => <li key={i}>{renderInline(item, `l${k}-${i}`)}</li>)
      blocks.push(list.ordered ? <ol key={k}>{items}</ol> : <ul key={k}>{items}</ul>)
      list = null
    }
  }
  const flushQuote = () => {
    if (quote.length) {
      const k = key++
      blocks.push(<blockquote key={k}>{renderInline(quote.join(" "), `q${k}`)}</blockquote>)
      quote = []
    }
  }
  const flushAll = () => {
    flushParagraph()
    flushList()
    flushQuote()
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (!line) {
      flushAll()
      continue
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line)
    if (heading) {
      flushAll()
      const k = key++
      // The page title is the <h1>, so post headings start at <h2>.
      const level = heading[1].length === 1 ? "h2" : heading[1].length === 2 ? "h2" : "h3"
      blocks.push(React.createElement(level, { key: k }, renderInline(heading[2], `h${k}`)))
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(line)) {
      flushAll()
      blocks.push(<hr key={key++} />)
      continue
    }

    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(line)
    if (image && SAFE_IMAGE.test(image[2])) {
      flushAll()
      blocks.push(
        <figure key={key++}>
          {/* eslint-disable-next-line @next/next/no-img-element -- author-supplied URL, host isn't known at build time */}
          <img src={image[2]} alt={image[1]} loading="lazy" className="w-full rounded-xl" />
          {image[1] && <figcaption>{image[1]}</figcaption>}
        </figure>
      )
      continue
    }

    const bullet = /^[-*]\s+(.+)$/.exec(line)
    const numbered = /^\d+[.)]\s+(.+)$/.exec(line)
    if (bullet || numbered) {
      flushParagraph()
      flushQuote()
      const ordered = !!numbered
      if (list && list.ordered !== ordered) flushList()
      if (!list) list = { ordered, items: [] }
      list.items.push((bullet ?? numbered)![1])
      continue
    }

    const quoted = /^>\s?(.*)$/.exec(line)
    if (quoted) {
      flushParagraph()
      flushList()
      quote.push(quoted[1])
      continue
    }

    flushList()
    flushQuote()
    paragraph.push(line)
  }
  flushAll()

  return <>{blocks}</>
}
