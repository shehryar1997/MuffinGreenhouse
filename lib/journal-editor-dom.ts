// Turns what is typed in the admin's visual editor (a contentEditable element) back into the journal's stored text
// format (see lib/journal-markdown.ts). Browsers produce different markup for the same formatting (<b> vs <strong>,
// <span style="font-weight:bold">, <div> vs <p>, align="center" vs style="text-align:center"), so this reads all of them.
// Only a known set of things is kept; anything else (pasted colours, fonts, scripts) is dropped.

import { SAFE_HREF, SAFE_IMAGE, escapeInline, escapeLineStart, type Align } from "@/lib/journal-markdown"

const BLOCK_TAGS = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "BLOCKQUOTE", "HR", "FIGURE", "PRE", "TABLE", "SECTION", "ARTICLE"])

/** Wraps each non-empty line separately, keeping edge whitespace outside the markers (`** bold**` isn't bold). */
function wrap(marker: string, inner: string): string {
  return inner
    .split("\n")
    .map((line) => {
      const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(line)!
      return m[2] ? `${m[1]}${marker}${m[2]}${marker}${m[3]}` : line
    })
    .join("\n")
}

function styleFlags(el: HTMLElement) {
  const { fontWeight, fontStyle, textDecorationLine, textDecoration } = el.style
  const weight = parseInt(fontWeight, 10)
  return {
    bold: fontWeight === "bold" || fontWeight === "bolder" || weight >= 600,
    italic: fontStyle === "italic",
    underline: `${textDecorationLine} ${textDecoration}`.includes("underline"),
  }
}

function safeHref(raw: string | null): string | null {
  const href = (raw ?? "").trim()
  if (!href || !SAFE_HREF.test(href)) return null
  return href.replace(/\s/g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29")
}

function inlineOf(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeInline((node.textContent ?? "").replace(/[ \t\r\n\u00a0]+/g, " "))
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ""
  const el = node as HTMLElement
  const tag = el.tagName

  if (tag === "BR") return "\n"
  if (tag === "IMG" || tag === "SCRIPT" || tag === "STYLE") return ""
  if (tag === "CODE") {
    const code = el.textContent ?? ""
    return code && !code.includes("`") ? `\`${code}\`` : escapeInline(code)
  }

  let text = inlinesOf(el)
  if (tag === "A") {
    const href = safeHref(el.getAttribute("href"))
    const label = text.replace(/\s*\n\s*/g, " ").trim()
    text = href && label ? `[${label}](${href})` : text
  }

  const flags = styleFlags(el)
  if (tag === "B" || tag === "STRONG" || flags.bold) text = wrap("**", text)
  // _italic_ only opens/closes next to a space or punctuation, so italic that touches a letter uses *italic*.
  if (tag === "I" || tag === "EM" || flags.italic) text = wrap(touchesWord(el) ? "*" : "_", text)
  if (tag === "U" || flags.underline) text = wrap("++", text)
  return text
}

function touchesWord(el: Element): boolean {
  const before = el.previousSibling?.textContent ?? ""
  const after = el.nextSibling?.textContent ?? ""
  return /[A-Za-z0-9]$/.test(before) || /^[A-Za-z0-9]/.test(after)
}

function inlinesOf(parent: Node): string {
  return Array.from(parent.childNodes).map(inlineOf).join("")
}

function alignOf(el: Element): Align {
  const value = ((el as HTMLElement).style?.textAlign || el.getAttribute("align") || "").toLowerCase()
  if (value === "center") return "center"
  if (value === "right" || value === "end") return "right"
  if (value === "justify") return "justify"
  return "left"
}

/** The lines of a block's text, trimmed, with blank lines at the start and end removed. */
function linesOf(text: string): string[] {
  const lines = text.split("\n").map((l) => l.trim())
  while (lines.length && !lines[0]) lines.shift()
  while (lines.length && !lines[lines.length - 1]) lines.pop()
  return lines
}

function paragraphOf(text: string, align: Align): string | null {
  const lines = linesOf(text)
  if (!lines.length) return null
  const tag = align === "left" ? "" : `{${align}} `
  return lines.map((line, i) => (i === 0 ? `${tag}${escapeLineStart(line)}` : escapeLineStart(line))).join("\n")
}

function hasBlockChild(el: Element): boolean {
  return Array.from(el.children).some((c) => BLOCK_TAGS.has(c.tagName))
}

function listItems(list: Element, out: string[], ordered: boolean) {
  for (const li of Array.from(list.children)) {
    if (li.tagName !== "LI") continue
    const own = Array.from(li.childNodes).filter((n) => !(n.nodeType === Node.ELEMENT_NODE && /^(UL|OL)$/.test((n as Element).tagName)))
    const text = own.map(inlineOf).join("").replace(/\s*\n\s*/g, " ").trim()
    if (text) out.push(`${ordered ? "1." : "-"} ${text}`)
    // A nested list (from Tab/indent) is flattened: the journal only has one list level.
    for (const nested of Array.from(li.children)) {
      if (nested.tagName === "UL" || nested.tagName === "OL") listItems(nested, out, nested.tagName === "OL")
    }
  }
}

function blocksOf(parent: Element, out: string[]) {
  let stray: Node[] = []
  const flushStray = () => {
    if (!stray.length) return
    const p = paragraphOf(stray.map(inlineOf).join(""), "left")
    if (p) out.push(p)
    stray = []
  }

  for (const node of Array.from(parent.childNodes)) {
    if (node.nodeType !== Node.ELEMENT_NODE || !BLOCK_TAGS.has((node as Element).tagName)) {
      stray.push(node)
      continue
    }
    flushStray()
    const el = node as Element
    const tag = el.tagName

    if (tag === "HR") {
      out.push("---")
    } else if (tag === "FIGURE") {
      const img = el.querySelector("img")
      const src = img?.getAttribute("src") ?? ""
      if (img && SAFE_IMAGE.test(src)) {
        const alt = (img.getAttribute("alt") ?? "").replace(/[\][\n]/g, " ").trim()
        out.push(`![${alt}](${src.replace(/\s/g, "%20").replace(/\)/g, "%29")})`)
      }
    } else if (tag === "UL" || tag === "OL") {
      const items: string[] = []
      listItems(el, items, tag === "OL")
      if (items.length) out.push(items.join("\n"))
    } else if (tag === "BLOCKQUOTE") {
      const inner: string[] = []
      if (hasBlockChild(el)) blocksOf(el, inner)
      else {
        const p = paragraphOf(inlinesOf(el), "left")
        if (p) inner.push(p)
      }
      const lines = inner.join("\n").split("\n")
      if (lines.length && lines[0]) {
        const align = alignOf(el)
        const first = align === "left" ? lines[0] : `{${align}} ${lines[0]}`
        out.push([`> ${first}`, ...lines.slice(1).map((l) => `> ${l}`)].join("\n"))
      }
    } else if (/^H[1-6]$/.test(tag)) {
      const text = linesOf(inlinesOf(el)).join(" ")
      if (text) {
        const align = alignOf(el)
        out.push(`${tag === "H1" || tag === "H2" ? "##" : "###"} ${align === "left" ? "" : `{${align}} `}${text}`)
      }
    } else if (hasBlockChild(el)) {
      blocksOf(el, out)
    } else {
      const p = paragraphOf(inlinesOf(el), alignOf(el))
      if (p) out.push(p)
    }
  }
  flushStray()
}

/** The editor's content as journal text. Blocks are separated by a blank line. */
export function editorToMarkdown(root: HTMLElement): string {
  const out: string[] = []
  blocksOf(root, out)
  return out.join("\n\n")
}
