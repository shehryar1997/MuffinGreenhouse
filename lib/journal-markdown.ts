// The journal's text format. Posts are stored as plain text ("markdown with a few extras") and this file is the
// one place that knows the syntax:
//   parseBlocks()   text  -> block tree      (used by the public page renderer and the editor)
//   blocksToHtml()  tree  -> escaped HTML     (loads an existing post into the visual editor)
//   escapeInline()  helpers the editor uses when it saves what was typed back to text
//
// Everything is built from a parsed tree, never from raw HTML, so a post can't inject markup or script.
//
// Syntax: # / ## / ### headings, paragraphs, - bullets, 1. numbers, > quotes, --- rules, ![caption](https://image),
// and inline **bold**, _italic_ (or *italic*), ++underline++, `code`, [links](url).
// Alignment: put {center}, {right} or {justify} right after a heading/quote marker, or at the start of a paragraph.
// A backslash escapes the next symbol (\* \_ \[ ...). A single Enter inside a paragraph is a line break.

export type Align = "left" | "center" | "right" | "justify"

export type Inline =
  | string
  | { t: "strong" | "em" | "u"; c: Inline[] }
  | { t: "code"; c: string }
  | { t: "link"; href: string; c: Inline[] }
  | { t: "br" }

export type Block =
  | { t: "p" | "h2" | "h3" | "quote"; align: Align; c: Inline[] }
  | { t: "list"; ordered: boolean; items: Inline[][] }
  | { t: "hr" }
  | { t: "img"; src: string; alt: string }

export const SAFE_HREF = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i
export const SAFE_IMAGE = /^https:\/\//i

const ESCAPABLE = "\\*_`[]+#>-.{}!()"
const ALIGN_PREFIX = /^\{(left|center|right|justify)\}\s*/i

// ---------- inline ----------

/** Index of the closing marker (skipping escapes and `code`), or -1. Empty content doesn't count. */
function findClose(s: string, marker: string, from: number): number {
  for (let j = from; j < s.length; j++) {
    const ch = s[j]
    if (ch === "\\") { j++; continue }
    if (ch === "`") {
      const end = s.indexOf("`", j + 1)
      if (end > j) { j = end; continue }
    }
    if (!s.startsWith(marker, j)) continue
    if (marker === "*" && (s[j + 1] === "*" || s[j - 1] === "*")) continue
    if (marker === "_" && (/\s/.test(s[j - 1] ?? " ") || /[A-Za-z0-9]/.test(s[j + 1] ?? ""))) continue
    if (j === from) return -1
    // "**bold _it_**": of the three stars at the end, the last two close the bold.
    return marker === "**" && s[j + 2] === "*" ? j + 1 : j
  }
  return -1
}

export function parseInline(s: string): Inline[] {
  const out: Inline[] = []
  let buf = ""
  const flush = () => {
    if (buf) { out.push(buf); buf = "" }
  }
  let i = 0
  while (i < s.length) {
    const ch = s[i]

    if (ch === "\\" && i + 1 < s.length && ESCAPABLE.includes(s[i + 1])) {
      buf += s[i + 1]
      i += 2
      continue
    }

    if (ch === "`") {
      const end = s.indexOf("`", i + 1)
      if (end > i + 1) {
        flush()
        out.push({ t: "code", c: s.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }

    // Older posts may carry ***bold italic***.
    if (s.startsWith("***", i)) {
      const end = findClose(s, "***", i + 3)
      if (end > 0) {
        flush()
        out.push({ t: "strong", c: [{ t: "em", c: parseInline(s.slice(i + 3, end)) }] })
        i = end + 3
        continue
      }
    }

    if (s.startsWith("**", i) || s.startsWith("++", i)) {
      const marker = s.slice(i, i + 2)
      const end = findClose(s, marker, i + 2)
      if (end > 0) {
        flush()
        out.push({ t: marker === "**" ? "strong" : "u", c: parseInline(s.slice(i + 2, end)) })
        i = end + 2
        continue
      }
    }

    const nextCh = s[i + 1]
    const canOpenItalic =
      (ch === "*" && nextCh !== undefined && !/[\s*]/.test(nextCh)) ||
      (ch === "_" && nextCh !== undefined && !/[\s_]/.test(nextCh) && !/[A-Za-z0-9]/.test(s[i - 1] ?? " "))
    if (canOpenItalic) {
      const end = findClose(s, ch, i + 1)
      if (end > 0) {
        flush()
        out.push({ t: "em", c: parseInline(s.slice(i + 1, end)) })
        i = end + 1
        continue
      }
    }

    if (ch === "[") {
      let j = i + 1
      while (j < s.length && s[j] !== "]") j += s[j] === "\\" ? 2 : 1
      if (s[j] === "]" && s[j + 1] === "(") {
        const close = s.indexOf(")", j + 2)
        const href = close > 0 ? s.slice(j + 2, close) : ""
        if (href && !/\s/.test(href)) {
          flush()
          const label = parseInline(s.slice(i + 1, j))
          if (SAFE_HREF.test(href)) out.push({ t: "link", href, c: label })
          else out.push(s.slice(i, close + 1)) // not a link we allow: show it as typed
          i = close + 1
          continue
        }
      }
    }

    buf += ch
    i++
  }
  flush()
  return out
}

// ---------- blocks ----------

function takeAlign(text: string): { align: Align; text: string } {
  const m = ALIGN_PREFIX.exec(text)
  return m ? { align: m[1].toLowerCase() as Align, text: text.slice(m[0].length) } : { align: "left", text }
}

function joinLines(lines: string[]): Inline[] {
  const out: Inline[] = []
  lines.forEach((line, i) => {
    if (i > 0) out.push({ t: "br" })
    out.push(...parseInline(line))
  })
  return out
}

export function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n")
  const blocks: Block[] = []
  let paragraph: { align: Align; lines: string[] } | null = null
  let list: { ordered: boolean; items: Inline[][] } | null = null
  let quote: { align: Align; lines: string[] } | null = null

  const flushParagraph = () => {
    if (paragraph) blocks.push({ t: "p", align: paragraph.align, c: joinLines(paragraph.lines) })
    paragraph = null
  }
  const flushList = () => {
    if (list) blocks.push({ t: "list", ordered: list.ordered, items: list.items })
    list = null
  }
  const flushQuote = () => {
    if (quote) blocks.push({ t: "quote", align: quote.align, c: joinLines(quote.lines) })
    quote = null
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
      const { align, text } = takeAlign(heading[2])
      // The page title is the <h1>, so post headings start at <h2>.
      blocks.push({ t: heading[1].length === 3 ? "h3" : "h2", align, c: parseInline(text) })
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(line)) {
      flushAll()
      blocks.push({ t: "hr" })
      continue
    }

    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(line)
    if (image && SAFE_IMAGE.test(image[2])) {
      flushAll()
      blocks.push({ t: "img", src: image[2], alt: image[1] })
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
      list.items.push(parseInline((bullet ?? numbered)![1]))
      continue
    }

    const quoted = /^>\s?(.*)$/.exec(line)
    if (quoted) {
      flushParagraph()
      flushList()
      if (!quote) {
        const first = takeAlign(quoted[1])
        quote = { align: first.align, lines: [first.text] }
      } else {
        quote.lines.push(quoted[1])
      }
      continue
    }

    flushList()
    flushQuote()
    if (!paragraph) {
      const first = takeAlign(line)
      paragraph = { align: first.align, lines: [first.text] }
    } else {
      paragraph.lines.push(line)
    }
  }
  flushAll()

  return blocks
}

// ---------- HTML (for loading a post into the visual editor) ----------

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function inlineToHtml(nodes: Inline[]): string {
  return nodes
    .map((n) => {
      if (typeof n === "string") return escapeHtml(n)
      switch (n.t) {
        case "br":
          return "<br>"
        case "code":
          return `<code>${escapeHtml(n.c)}</code>`
        case "link":
          return `<a href="${escapeHtml(n.href)}">${inlineToHtml(n.c)}</a>`
        default:
          return `<${n.t}>${inlineToHtml(n.c)}</${n.t}>`
      }
    })
    .join("")
}

const alignAttr = (align: Align) => (align === "left" ? "" : ` style="text-align: ${align}"`)

export function blocksToHtml(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.t) {
        case "hr":
          return "<hr>"
        case "img":
          return imageBlockHtml(b.src, b.alt)
        case "list": {
          const tag = b.ordered ? "ol" : "ul"
          return `<${tag}>${b.items.map((item) => `<li>${inlineToHtml(item)}</li>`).join("")}</${tag}>`
        }
        case "quote":
          return `<blockquote${alignAttr(b.align)}>${inlineToHtml(b.c)}</blockquote>`
        default:
          return `<${b.t}${alignAttr(b.align)}>${inlineToHtml(b.c) || "<br>"}</${b.t}>`
      }
    })
    .join("")
}

/** An image is one non-editable block in the editor: click it and press Delete to remove it. */
export function imageBlockHtml(src: string, alt: string): string {
  return (
    `<figure data-image contenteditable="false">` +
    `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">` +
    (alt ? `<figcaption>${escapeHtml(alt)}</figcaption>` : "") +
    `</figure>`
  )
}

export function markdownToHtml(source: string): string {
  return blocksToHtml(parseBlocks(source))
}

// ---------- escaping (editor -> text) ----------

/** Escapes what would otherwise be read as formatting inside a line of text. */
export function escapeInline(text: string): string {
  return text.replace(/[\\*_`[\]+]/g, "\\$&")
}

/** Escapes a line's first characters when they'd be read as a heading, list, quote, rule, image or alignment tag. */
export function escapeLineStart(line: string): string {
  if (/^[#>{!]/.test(line)) return `\\${line}`
  if (/^-(\s|-|$)/.test(line)) return `\\${line}` // "- item" and "---"
  const numbered = /^(\d+)([.)])(\s|$)/.exec(line) // "1. item"
  if (numbered) return `${numbered[1]}\\${line.slice(numbered[1].length)}`
  return line
}
