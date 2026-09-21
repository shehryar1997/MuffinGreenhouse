"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Camera,
  Check,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Underline,
  Undo2,
  Unlink,
  Upload,
  X,
} from "lucide-react"
import { editorToMarkdown } from "@/lib/journal-editor-dom"
import { SAFE_HREF, SAFE_IMAGE, imageBlockHtml, markdownToHtml } from "@/lib/journal-markdown"
import { uploadAdminImage } from "@/lib/admin-upload"

// A Word-style editor for journal posts. What you see is what visitors see (it uses the same .journal-prose
// styles). Behind the scenes the text is saved in the journal's plain-text format (lib/journal-markdown.ts), so
// nobody has to learn any symbols, and posts written before this editor existed open and save unchanged.

type BlockKind = "p" | "h2" | "h3" | "quote"
type Align = "left" | "center" | "right" | "justify"

interface Active {
  bold: boolean
  italic: boolean
  underline: boolean
  ul: boolean
  ol: boolean
  block: BlockKind
  align: Align
}

const NONE: Active = { bold: false, italic: false, underline: false, ul: false, ol: false, block: "p", align: "left" }
const EMPTY_HTML = "<p><br></p>"

function ToolButton({
  label,
  onClick,
  active = false,
  disabled = false,
  children,
}: {
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded transition-colors disabled:opacity-40 ${
        active ? "bg-forest-700 text-white" : "text-foreground/80 hover:bg-muted"
      }`}
    >
      {children}
    </button>
  )
}

const Divider = () => <span className="mx-1 h-5 w-px bg-border" aria-hidden />

function closestBlock(node: Node | null, root: HTMLElement): HTMLElement | null {
  let cur: Node | null = node
  while (cur && cur !== root) {
    if (cur.nodeType === Node.ELEMENT_NODE && /^(P|DIV|H1|H2|H3|H4|LI|BLOCKQUOTE)$/.test((cur as Element).tagName)) return cur as HTMLElement
    cur = cur.parentNode
  }
  return null
}

function ancestor(node: Node | null, root: HTMLElement, pattern: RegExp): HTMLElement | null {
  let cur: Node | null = node
  while (cur && cur !== root) {
    if (cur.nodeType === Node.ELEMENT_NODE && pattern.test((cur as Element).tagName)) return cur as HTMLElement
    cur = cur.parentNode
  }
  return null
}

/** Turns an address typed into the link box into something safe to store, or null if it isn't usable. */
function cleanHref(raw: string): string | null {
  const value = raw.trim()
  if (!value || /\s/.test(value)) return null
  if (SAFE_HREF.test(value)) return value
  if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(value)) return `https://${value}`
  return null
}

export function RichEditor({ name, initialMarkdown }: { name: string; initialMarkdown: string }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [initialHtml] = useState(() => markdownToHtml(initialMarkdown) || EMPTY_HTML)
  const [markdown, setMarkdown] = useState(initialMarkdown)
  const [active, setActive] = useState<Active>(NONE)
  const [panel, setPanel] = useState<"link" | "image" | null>(null)
  const [linkUrl, setLinkUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [uploading, setUploading] = useState<"camera" | "gallery" | null>(null)
  const [panelError, setPanelError] = useState<string | null>(null)

  const sync = useCallback(() => {
    const root = editorRef.current
    if (!root) return
    // An emptied editor (browsers leave nothing, a lone <br>, or the old heading/centering on an empty line)
    // goes back to one plain paragraph, so the next thing typed starts fresh.
    const hasContent = !!root.textContent?.trim() || !!root.querySelector("figure, hr, img")
    if (!hasContent && root.innerHTML !== EMPTY_HTML) {
      root.innerHTML = EMPTY_HTML
      const range = document.createRange()
      range.setStart(root.firstChild as Node, 0)
      range.collapse(true)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
    // Indent/quote commands add inline margins and borders that would fight the post styles.
    root.querySelectorAll("blockquote[style], ul[style], ol[style]").forEach((el) => el.removeAttribute("style"))
    setMarkdown(editorToMarkdown(root))
  }, [])

  const readActive = useCallback(() => {
    const root = editorRef.current
    const sel = window.getSelection()
    if (!root || !sel || !sel.anchorNode || !root.contains(sel.anchorNode)) return
    const block = closestBlock(sel.anchorNode, root)
    const heading = ancestor(sel.anchorNode, root, /^H[1-6]$/)
    const align = block ? getComputedStyle(block).textAlign : "left"
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
      block: ancestor(sel.anchorNode, root, /^BLOCKQUOTE$/) ? "quote" : heading ? (heading.tagName === "H3" ? "h3" : "h2") : "p",
      align: align === "center" || align === "right" || align === "justify" ? align : align === "end" ? "right" : "left",
    })
  }, [])

  useEffect(() => {
    document.execCommand("defaultParagraphSeparator", false, "p")
    document.addEventListener("selectionchange", readActive)
    return () => document.removeEventListener("selectionchange", readActive)
  }, [readActive])

  function run(command: string, value?: string) {
    const root = editorRef.current
    if (!root) return
    root.focus()
    document.execCommand(command, false, value)
    sync()
    readActive()
  }

  function runAlign(command: "justifyLeft" | "justifyCenter" | "justifyRight" | "justifyFull") {
    // CSS mode makes the browser write style="text-align: ..." on the paragraph instead of an align attribute.
    document.execCommand("styleWithCSS", false, "true")
    run(command)
    document.execCommand("styleWithCSS", false, "false")
  }

  function setBlock(kind: BlockKind) {
    const root = editorRef.current
    if (!root) return
    root.focus()
    const inQuote = !!ancestor(window.getSelection()?.anchorNode ?? null, root, /^BLOCKQUOTE$/)
    if (kind === "quote") {
      if (inQuote) document.execCommand("outdent")
      else document.execCommand("formatBlock", false, "<blockquote>")
    } else {
      if (inQuote) document.execCommand("outdent")
      document.execCommand("formatBlock", false, `<${kind}>`)
    }
    sync()
    readActive()
  }

  function rememberSelection() {
    const root = editorRef.current
    const sel = window.getSelection()
    savedRange.current = root && sel && sel.rangeCount && root.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null
  }

  function restoreSelection() {
    const root = editorRef.current
    if (!root) return
    root.focus()
    const range = savedRange.current
    if (range) {
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }

  function openLinkPanel() {
    rememberSelection()
    const root = editorRef.current
    const sel = window.getSelection()
    const existing = root && sel?.anchorNode ? ancestor(sel.anchorNode, root, /^A$/) : null
    setLinkUrl(existing?.getAttribute("href") ?? "")
    setPanelError(null)
    setPanel("link")
  }

  function openImagePanel() {
    rememberSelection()
    setImageUrl("")
    setCaption("")
    setPanelError(null)
    setPanel("image")
  }

  function applyLink() {
    const href = cleanHref(linkUrl)
    if (!href) {
      setPanelError("Enter a full web address, like https://muffinplants.com/shop/all")
      return
    }
    restoreSelection()
    const sel = window.getSelection()
    if (sel && sel.isCollapsed) {
      const root = editorRef.current
      const existing = root && sel.anchorNode ? ancestor(sel.anchorNode, root, /^A$/) : null
      if (existing) {
        existing.setAttribute("href", href)
      } else {
        document.execCommand("insertHTML", false, `<a href="${href.replace(/"/g, "&quot;")}">${href.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</a>`)
      }
    } else {
      document.execCommand("createLink", false, href)
    }
    setPanel(null)
    sync()
  }

  function removeLink() {
    restoreSelection()
    const root = editorRef.current
    const sel = window.getSelection()
    const anchor = root && sel?.anchorNode ? ancestor(sel.anchorNode, root, /^A$/) : null
    if (anchor && sel) {
      const range = document.createRange()
      range.selectNodeContents(anchor)
      sel.removeAllRanges()
      sel.addRange(range)
    }
    document.execCommand("unlink")
    setPanel(null)
    sync()
  }

  async function onPickFile(source: "camera" | "gallery", e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploading(source)
    setPanelError(null)
    try {
      setImageUrl(await uploadAdminImage(file, "journal"))
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploading(null)
    }
  }

  function insertImage() {
    const src = imageUrl.trim()
    if (!SAFE_IMAGE.test(src) || /\s/.test(src)) {
      setPanelError("Upload an image, or paste an address that starts with https://")
      return
    }
    restoreSelection()
    const alt = caption.replace(/[\][\n]/g, " ").trim()
    document.execCommand("insertHTML", false, `${imageBlockHtml(src, alt)}<p><br></p>`)
    setPanel(null)
    sync()
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    // Paste as plain text: text copied from Word or a web page drags in fonts, colours and junk markup.
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n").trim()
    if (!text) return
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    const paragraphs = text.split(/\n{2,}/)
    if (paragraphs.length === 1) {
      document.execCommand("insertHTML", false, esc(text).replace(/\n/g, "<br>"))
    } else {
      document.execCommand("insertHTML", false, paragraphs.map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join(""))
    }
    sync()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault()
      openLinkPanel()
      return
    }
    // Shift+Enter is a line break inside the paragraph (Safari starts a new paragraph instead).
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault()
      document.execCommand("insertLineBreak")
      sync()
      return
    }
    // An image is a non-editable block; browsers don't reliably delete it, so do it explicitly.
    if (e.key === "Delete" || e.key === "Backspace") {
      const figure = editorRef.current?.querySelector("figure.is-selected")
      if (figure) {
        e.preventDefault()
        const range = document.createRange()
        range.selectNode(figure)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
        document.execCommand("delete")
        if (figure.isConnected) figure.remove()
        sync()
      }
    }
  }

  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    const root = editorRef.current
    if (!root) return
    root.querySelectorAll("figure.is-selected").forEach((f) => f.classList.remove("is-selected"))
    const figure = (e.target as HTMLElement).closest("figure")
    if (figure && root.contains(figure)) {
      // Select the whole image so Delete/Backspace removes it.
      figure.classList.add("is-selected")
      const range = document.createRange()
      range.selectNode(figure)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }

  const isEmpty = markdown.trim() === ""

  return (
    <div className="rounded-md border border-input bg-surface">
      <input type="hidden" name={name} value={markdown} />

      {/* Buttons must not take focus from the text, or the selection they act on is lost. */}
      <div
        role="toolbar"
        aria-label="Formatting"
        className="sticky top-14 z-10 flex flex-wrap items-center gap-0.5 rounded-t-md border-b bg-muted px-2 py-1.5 lg:top-0"
        onMouseDown={(e) => {
          if (!(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLSelectElement)) e.preventDefault()
        }}
      >
        <ToolButton label="Undo (Ctrl+Z)" onClick={() => run("undo")}>
          <Undo2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Redo (Ctrl+Y)" onClick={() => run("redo")}>
          <Redo2 className="h-4 w-4" />
        </ToolButton>
        <Divider />

        <select
          aria-label="Text style"
          value={active.block}
          onChange={(e) => setBlock(e.target.value as BlockKind)}
          className="h-8 rounded border border-input bg-surface px-2 text-sm text-foreground"
        >
          <option value="p">Normal text</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
          <option value="quote">Quote</option>
        </select>
        <Divider />

        <ToolButton label="Bold (Ctrl+B)" active={active.bold} onClick={() => run("bold")}>
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Italic (Ctrl+I)" active={active.italic} onClick={() => run("italic")}>
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Underline (Ctrl+U)" active={active.underline} onClick={() => run("underline")}>
          <Underline className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Clear formatting" onClick={() => run("removeFormat")}>
          <RemoveFormatting className="h-4 w-4" />
        </ToolButton>
        <Divider />

        <ToolButton label="Align left" active={active.align === "left"} onClick={() => runAlign("justifyLeft")}>
          <AlignLeft className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Center" active={active.align === "center"} onClick={() => runAlign("justifyCenter")}>
          <AlignCenter className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Align right" active={active.align === "right"} onClick={() => runAlign("justifyRight")}>
          <AlignRight className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Justify" active={active.align === "justify"} onClick={() => runAlign("justifyFull")}>
          <AlignJustify className="h-4 w-4" />
        </ToolButton>
        <Divider />

        <ToolButton label="Bulleted list" active={active.ul} onClick={() => run("insertUnorderedList")}>
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Numbered list" active={active.ol} onClick={() => run("insertOrderedList")}>
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Quote" active={active.block === "quote"} onClick={() => setBlock("quote")}>
          <Quote className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Divider line" onClick={() => run("insertHorizontalRule")}>
          <Minus className="h-4 w-4" />
        </ToolButton>
        <Divider />

        <ToolButton label="Add or edit link (Ctrl+K)" onClick={openLinkPanel}>
          <Link2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Remove link" onClick={removeLink}>
          <Unlink className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Insert image" onClick={openImagePanel}>
          <ImagePlus className="h-4 w-4" />
        </ToolButton>
      </div>

      {panel === "link" && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-3 py-2 text-sm">
          <label htmlFor="link-url" className="font-medium text-foreground">
            Link address
          </label>
          <input
            id="link-url"
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                applyLink()
              } else if (e.key === "Escape") setPanel(null)
            }}
            placeholder="https://…"
            className="min-w-[14rem] flex-1 rounded border border-input bg-surface px-2 py-1"
          />
          <button type="button" onClick={applyLink} className="inline-flex items-center gap-1 rounded bg-forest-700 px-3 py-1 text-white hover:bg-forest-800">
            <Check className="h-3.5 w-3.5" /> Apply
          </button>
          <button type="button" onClick={() => setPanel(null)} className="rounded border border-input bg-surface px-3 py-1 hover:bg-muted">
            Cancel
          </button>
          <p className="basis-full text-xs text-muted-foreground">Select some text first to turn it into a link. With nothing selected, the address itself is inserted.</p>
          {panelError && (
            <p role="alert" className="basis-full text-xs text-red-700">
              {panelError}
            </p>
          )}
        </div>
      )}

      {panel === "image" && (
        <div className="space-y-2 border-b bg-muted/50 px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={!!uploading}
              className="inline-flex items-center gap-1.5 rounded border border-input bg-surface px-3 py-1 hover:bg-muted disabled:opacity-50"
            >
              {uploading === "camera" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              Camera
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={!!uploading}
              className="inline-flex items-center gap-1.5 rounded border border-input bg-surface px-3 py-1 hover:bg-muted disabled:opacity-50"
            >
              {uploading === "gallery" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Gallery
            </button>
            <span className="text-muted-foreground">or</span>
            <input
              aria-label="Image address"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="paste an image address (https://…)"
              className="min-w-[14rem] flex-1 rounded border border-input bg-surface px-2 py-1"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              aria-label="Image caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  insertImage()
                } else if (e.key === "Escape") setPanel(null)
              }}
              placeholder="Caption (optional, also read aloud to screen-reader users)"
              className="min-w-[14rem] flex-1 rounded border border-input bg-surface px-2 py-1"
            />
            <button type="button" onClick={insertImage} disabled={!!uploading || !imageUrl} className="inline-flex items-center gap-1 rounded bg-forest-700 px-3 py-1 text-white hover:bg-forest-800 disabled:opacity-50">
              <Check className="h-3.5 w-3.5" /> Insert
            </button>
            <button type="button" onClick={() => setPanel(null)} className="inline-flex items-center gap-1 rounded border border-input bg-surface px-3 py-1 hover:bg-muted">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
          {imageUrl && SAFE_IMAGE.test(imageUrl) && (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary URL
            <img src={imageUrl} alt="" className="max-h-32 rounded border" />
          )}
          {panelError && (
            <p role="alert" className="text-xs text-red-700">
              {panelError}
            </p>
          )}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPickFile("camera", e)} />
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickFile("gallery", e)} />
        </div>
      )}

      <div className="relative">
        {isEmpty && (
          <p className="pointer-events-none absolute left-5 top-5 text-[1.0625rem] text-muted-foreground" aria-hidden>
            Start writing your article. Press Enter for a new paragraph.
          </p>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Article"
          spellCheck
          onInput={sync}
          onBlur={sync}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          onClick={onClick}
          className="journal-prose journal-editor min-h-[22rem] rounded-b-lg px-5 py-5"
          dangerouslySetInnerHTML={{ __html: initialHtml }}
        />
      </div>
    </div>
  )
}
