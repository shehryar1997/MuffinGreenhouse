import * as React from "react"
import { parseBlocks, type Align, type Inline } from "@/lib/journal-markdown"

// Renders a journal post (see lib/journal-markdown.ts for the syntax). It builds React elements from a parsed
// tree (never raw HTML), so post content can't inject markup or script no matter what is typed in the admin editor.

function renderInline(nodes: Inline[], keyPrefix: string): React.ReactNode[] {
  return nodes.map((node, i) => {
    if (typeof node === "string") return node
    const key = `${keyPrefix}-${i}`
    switch (node.t) {
      case "br":
        return <br key={key} />
      case "strong":
        return <strong key={key}>{renderInline(node.c, key)}</strong>
      case "em":
        return <em key={key}>{renderInline(node.c, key)}</em>
      case "u":
        return <u key={key}>{renderInline(node.c, key)}</u>
      case "code":
        return (
          <code key={key} className="rounded bg-muted px-1.5 py-0.5 text-[0.9em]">
            {node.c}
          </code>
        )
      case "link": {
        const external = /^https?:\/\//i.test(node.href)
        return (
          <a
            key={key}
            href={node.href}
            className="text-primary underline underline-offset-2 hover:no-underline"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {renderInline(node.c, key)}
          </a>
        )
      }
    }
  })
}

const alignStyle = (align: Align): React.CSSProperties | undefined => (align === "left" ? undefined : { textAlign: align })

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source).map((block, i) => {
    const key = `b${i}`
    switch (block.t) {
      case "hr":
        return <hr key={key} />
      case "img":
        return (
          <figure key={key}>
            {/* eslint-disable-next-line @next/next/no-img-element -- author-supplied URL, host isn't known at build time */}
            <img src={block.src} alt={block.alt} loading="lazy" className="w-full rounded-xl" />
            {block.alt && <figcaption>{block.alt}</figcaption>}
          </figure>
        )
      case "list": {
        const items = block.items.map((item, j) => <li key={j}>{renderInline(item, `${key}-${j}`)}</li>)
        return block.ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>
      }
      case "quote":
        return (
          <blockquote key={key} style={alignStyle(block.align)}>
            {renderInline(block.c, key)}
          </blockquote>
        )
      case "p":
        return (
          <p key={key} style={alignStyle(block.align)}>
            {renderInline(block.c, key)}
          </p>
        )
      default: {
        const Tag = block.t
        return (
          <Tag key={key} style={alignStyle(block.align)}>
            {renderInline(block.c, key)}
          </Tag>
        )
      }
    }
  })

  return <>{blocks}</>
}
