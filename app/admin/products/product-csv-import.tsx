"use client"

import { Fragment, useRef, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { ChevronDown, ChevronRight, Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react"
import { parseCsv, toCsv } from "@/lib/csv"
import {
  MAX_IMPORT_ROWS,
  isBlankRecord,
  isExampleRecord,
  mapHeaders,
  recordSlug,
  rowToRecord,
  templateRows,
  type HeaderMapping,
  type ImportPreview,
  type ImportRecord,
} from "@/lib/product-import"
import { Alert, Badge, ButtonLink, TableShell, Td, Th, Thead, Tr, buttonClass, inputClass, type Tone } from "../_components/ui"
import { importProductRows, type ImportRowResult } from "./actions"

type RowStatus = "checking" | "ready" | "error" | "skipped" | "imported"
type Row = { line: number; values: ImportRecord; status: RowStatus; message?: string; preview?: ImportPreview; rechecking?: boolean }
type Stage = "pick" | "checking" | "review" | "importing" | "done"

const MAX_FILE_BYTES = 2 * 1024 * 1024
const CHECK_BATCH = 25
const IMPORT_BATCH = 10

const STATUS_LABEL: Record<RowStatus, { label: string; tone: Tone }> = {
  checking: { label: "Checking…", tone: "neutral" },
  ready: { label: "Ready", tone: "success" },
  error: { label: "Error", tone: "danger" },
  skipped: { label: "Skipped", tone: "neutral" },
  imported: { label: "Imported", tone: "success" },
}

function downloadCsv(filename: string, rows: string[][]) {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const isXlsxFile = (file: File) => /\.xlsx$/i.test(file.name) || file.type === XLSX_TYPE

// Cell values from a spreadsheet come back as numbers, booleans and Dates, not strings; everything downstream
// (mapHeaders, rowToRecord, the enum/boolean parsers in lib/product-import) expects plain text, same as a CSV cell.
function cellToText(v: unknown): string {
  if (v === null || v === undefined) return ""
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v)
}

// Parses a .csv or .xlsx file into the same rows-of-strings shape. The xlsx reader is loaded on demand so choosing
// a CSV file (the common case) never pays for it.
async function fileToTable(file: File): Promise<string[][]> {
  if (!isXlsxFile(file)) return parseCsv(await file.text())
  const { readSheet } = await import("read-excel-file/browser")
  const rows = await readSheet(file) // first sheet only, same as opening the file and reading the active tab
  return rows.map((row) => row.map(cellToText))
}

// Merges a dry-run preview's generated fields into a row's values, but only into cells the sheet left blank: an
// edit the admin already made (or a value the sheet provided) is never overwritten.
function mergePreview(values: ImportRecord, preview: ImportPreview): ImportRecord {
  const next = { ...values }
  if (!next.meta_title?.trim()) next.meta_title = preview.metaTitle
  if (!next.meta_description?.trim()) next.meta_description = preview.metaDescription
  for (const v of preview.variants) {
    const col = `variant_${v.slot}_sku`
    if (!next[col]?.trim()) next[col] = v.sku
  }
  return next
}

export function ProductCsvImport() {
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<Stage>("pick")
  const [fileName, setFileName] = useState("")
  const [mapping, setMapping] = useState<HeaderMapping | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const fileInput = useRef<HTMLInputElement>(null)

  const busy = stage === "checking" || stage === "importing"
  const count = (status: RowStatus) => rows.filter((r) => r.status === status).length
  const rechecking = rows.some((r) => r.rechecking)

  function reset() {
    setStage("pick")
    setFileName("")
    setMapping(null)
    setRows([])
    setFileError(null)
    setProgress({ done: 0, total: 0 })
    setExpanded(new Set())
  }

  function applyResults(results: ImportRowResult[], okStatus: RowStatus) {
    const byLine = new Map(results.map((r) => [r.line, r]))
    setRows((current) =>
      current.map((row) => {
        const res = byLine.get(row.line)
        if (!res) return row
        if (!res.ok) return { ...row, status: "error", message: res.message }
        return {
          ...row,
          status: okStatus,
          message: undefined,
          preview: res.preview ?? row.preview,
          values: res.preview ? mergePreview(row.values, res.preview) : row.values,
        }
      })
    )
  }

  // Re-validates one row after the admin edits a generated field (a guessed variant SKU, the SEO title/description)
  // so a clash (duplicate SKU, etc.) introduced by the edit is caught before Import is enabled.
  async function recheckRow(line: number) {
    setRows((current) => current.map((r) => (r.line === line ? { ...r, rechecking: true } : r)))
    const row = rows.find((r) => r.line === line)
    if (!row) return
    try {
      const { results, error } = await importProductRows([{ line, values: row.values }], true)
      if (error) throw new Error(error)
      const res = results[0]
      setRows((current) =>
        current.map((r) =>
          r.line !== line
            ? r
            : res?.ok
              ? { ...r, status: "ready", message: undefined, preview: res.preview ?? r.preview, rechecking: false }
              : { ...r, status: "error", message: res?.message ?? "Couldn't check this row.", rechecking: false }
        )
      )
    } catch (err) {
      setRows((current) =>
        current.map((r) =>
          r.line === line ? { ...r, status: "error", message: err instanceof Error ? err.message : "Couldn't check this row.", rechecking: false } : r
        )
      )
    }
  }

  function editRow(line: number, column: string, value: string) {
    setRows((current) => current.map((r) => (r.line === line ? { ...r, values: { ...r.values, [column]: value } } : r)))
  }

  // Sends rows to the server a few at a time. A failed call marks just that batch as errored.
  async function runBatches(targets: Row[], size: number, dryRun: boolean) {
    setProgress({ done: 0, total: targets.length })
    for (let i = 0; i < targets.length; i += size) {
      const batch = targets.slice(i, i + size)
      try {
        const { results, error } = await importProductRows(batch.map((r) => ({ line: r.line, values: r.values })), dryRun)
        if (error) throw new Error(error)
        applyResults(results, dryRun ? "ready" : "imported")
      } catch (err) {
        const message = dryRun
          ? `Couldn't check this row: ${err instanceof Error ? err.message : "connection problem"}`
          : "Connection lost while saving. Look in the products list before importing this row again."
        applyResults(batch.map((r) => ({ line: r.line, ok: false, message })), "ready")
      }
      setProgress({ done: Math.min(i + size, targets.length), total: targets.length })
    }
  }

  async function handleFile(file: File) {
    setFileError(null)
    setMapping(null)
    if (file.size > MAX_FILE_BYTES) return setFileError("That file is larger than 2 MB. Split it into smaller files.")

    let table: string[][]
    try {
      table = await fileToTable(file)
    } catch {
      return setFileError(isXlsxFile(file) ? "Couldn't read this Excel file. Make sure it's a valid .xlsx file, not corrupted or password-protected." : "Couldn't read this file.")
    }
    const headerCells = table[0] ?? []
    if (headerCells.every((c) => c.trim() === "")) return setFileError("The file is empty, or its first row isn't a header row.")

    const map = mapHeaders(headerCells)
    setMapping(map)
    setFileName(file.name)
    if (map.missing.length > 0) {
      return setFileError(`These required columns are missing: ${map.missing.join(", ")}. Download the template to see the expected headers.`)
    }

    // Line numbers match the spreadsheet: the header is line 1.
    const parsed: Row[] = []
    table.slice(1).forEach((cells, i) => {
      const values = rowToRecord(map.columns, cells)
      if (!isBlankRecord(values)) parsed.push({ line: i + 2, values, status: "checking" })
    })
    if (parsed.length === 0) return setFileError("No product rows found under the header row.")
    if (parsed.length > MAX_IMPORT_ROWS) return setFileError(`This file has ${parsed.length} products; the limit is ${MAX_IMPORT_ROWS} per import. Split it into smaller files.`)

    // Checks that need the whole file: template examples, and SKUs / slugs repeated within it.
    const firstSku = new Map<string, number>()
    const firstSlug = new Map<string, number>()
    for (const row of parsed) {
      if (isExampleRecord(row.values)) {
        row.status = "skipped"
        row.message = "Example row from the template."
        continue
      }
      const sku = (row.values.sku ?? "").toLowerCase()
      const slug = recordSlug(row.values)
      if (sku && firstSku.has(sku)) {
        row.status = "error"
        row.message = `Same SKU as row ${firstSku.get(sku)} in this file.`
      } else if (slug && firstSlug.has(slug)) {
        row.status = "error"
        row.message = `Same slug as row ${firstSlug.get(slug)} in this file.`
      }
      if (sku && !firstSku.has(sku)) firstSku.set(sku, row.line)
      if (slug && !firstSlug.has(slug)) firstSlug.set(slug, row.line)
    }

    setRows(parsed)
    setStage("checking")
    await runBatches(parsed.filter((r) => r.status === "checking"), CHECK_BATCH, true)
    setStage("review")
  }

  async function startImport() {
    setStage("importing")
    await runBatches(rows.filter((r) => r.status === "ready"), IMPORT_BATCH, false)
    setStage("done")
  }

  function downloadFailed() {
    const columns = (mapping?.columns ?? []).filter((c): c is string => !!c)
    const failed = rows.filter((r) => r.status === "error")
    downloadCsv("products-import-failed.csv", [[...columns, "error"], ...failed.map((r) => [...columns.map((c) => r.values[c] ?? ""), r.message ?? ""])])
  }

  const ready = count("ready")
  const failed = count("error")
  const skipped = count("skipped")
  const imported = count("imported")

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (busy) return
        setOpen(next)
        if (!next) reset()
      }}
    >
      <Dialog.Trigger className={buttonClass({ variant: "secondary" })}>
        <Upload className="h-4 w-4" aria-hidden />
        Import CSV/Excel
      </Dialog.Trigger>
      <Dialog.Portal>
        {/* admin-scope: portalled to <body>, outside the admin theme, so the dialog brings the tokens with it. */}
        <Dialog.Overlay className="admin-scope fixed inset-0 z-50 bg-ink/50 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          onInteractOutside={(e) => e.preventDefault()}
          className="admin-scope fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-border bg-surface text-foreground shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div>
              <Dialog.Title className="font-sans text-base font-semibold tracking-normal">Import products from a spreadsheet</Dialog.Title>
              <Dialog.Description className="mt-1 text-[13px] leading-5 text-muted-foreground">
                One product per row. Each column is matched to a field of the Add product form, and every row is checked with the same rules as the form.
              </Dialog.Description>
            </div>
            <Dialog.Close disabled={busy} aria-label="Close" className={buttonClass({ variant: "ghost", size: "sm", className: "-mr-2 -mt-1 px-2" })}>
              <X className="h-4 w-4" aria-hidden />
            </Dialog.Close>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {stage === "pick" && (
              <>
                <div className="rounded-lg border border-dashed border-input bg-muted/40 px-6 py-10 text-center">
                  <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
                  <p className="mt-3 text-sm font-medium">Choose a .csv or .xlsx file</p>
                  <p className="mx-auto mt-1 max-w-md text-[13px] leading-5 text-muted-foreground">
                    From Excel, Google Sheets, or a .csv export. Up to {MAX_IMPORT_ROWS} products and 2 MB per file. Products are saved as drafts unless the
                    <span className="font-mono"> published </span> column says yes.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button type="button" onClick={() => fileInput.current?.click()} className={buttonClass({ variant: "primary" })}>
                      <Upload className="h-4 w-4" aria-hidden />
                      Choose file
                    </button>
                    <button type="button" onClick={() => downloadCsv("products-import-template.csv", templateRows())} className={buttonClass({ variant: "secondary" })}>
                      <Download className="h-4 w-4" aria-hidden />
                      Download template
                    </button>
                  </div>
                  <input
                    ref={fileInput}
                    type="file"
                    accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      e.target.value = "" // allow choosing the same file again after fixing it
                      if (file) void handleFile(file)
                    }}
                  />
                </div>
                {fileError && <Alert tone="danger" title={fileName ? `Can't import ${fileName}` : "Can't read this file"}>{fileError}</Alert>}
                {mapping && <MappingSummary mapping={mapping} />}
              </>
            )}

            {stage !== "pick" && (
              <>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <span className="font-medium">{fileName}</span>
                  <span className="text-muted-foreground">{rows.length} rows</span>
                  <span className="flex flex-wrap gap-2">
                    {imported > 0 && <Badge tone="success">{imported} imported</Badge>}
                    {stage !== "done" && ready > 0 && <Badge tone="success">{ready} ready</Badge>}
                    {failed > 0 && <Badge tone="danger">{failed} with errors</Badge>}
                    {skipped > 0 && <Badge tone="neutral">{skipped} skipped</Badge>}
                  </span>
                </div>

                {busy && (
                  <p role="status" className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {stage === "checking" ? "Checking rows" : "Importing"}: {progress.done} of {progress.total}. Keep this window open.
                  </p>
                )}
                {stage === "review" && failed > 0 && ready > 0 && (
                  <Alert tone="warning">Rows with errors won&apos;t be imported. Fix them in your sheet and import that file again, or continue with the {ready} ready rows.</Alert>
                )}
                {stage === "review" && ready === 0 && <Alert tone="danger">No rows can be imported yet. Fix the errors below in your sheet and choose the file again.</Alert>}
                {stage === "done" && (
                  <Alert tone={failed > 0 ? "warning" : "success"} title={`${imported} product${imported === 1 ? "" : "s"} imported`}>
                    {failed > 0 ? `${failed} row${failed === 1 ? "" : "s"} couldn't be saved; see the list below.` : "They're in your product list now."}
                  </Alert>
                )}

                {mapping && <MappingSummary mapping={mapping} />}

                <div className="max-h-[42vh] overflow-y-auto rounded-lg border border-border">
                  <TableShell className="rounded-none border-0" minWidth="min-w-[40rem]">
                    <Thead>
                      <tr>
                        <Th />
                        <Th>Row</Th>
                        <Th>Product</Th>
                        <Th>Category</Th>
                        <Th align="right">Price</Th>
                        <Th>Status</Th>
                      </tr>
                    </Thead>
                    <tbody>
                      {rows.map((row) => {
                        const s = STATUS_LABEL[row.status]
                        const canEdit = row.status !== "skipped" && row.status !== "checking"
                        const isOpen = expanded.has(row.line)
                        return (
                          <Fragment key={row.line}>
                            <Tr className="align-top">
                              <Td className="w-8 pr-0">
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpanded((current) => {
                                        const next = new Set(current)
                                        if (next.has(row.line)) next.delete(row.line)
                                        else next.add(row.line)
                                        return next
                                      })
                                    }
                                    aria-label={isOpen ? "Hide generated fields" : "Edit generated fields"}
                                    aria-expanded={isOpen}
                                    className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                  >
                                    {isOpen ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
                                  </button>
                                )}
                              </Td>
                              <Td className="tabular-nums text-muted-foreground">{row.line}</Td>
                              <Td>
                                <p className="font-medium">{row.values.name || <span className="text-muted-foreground">(no name)</span>}</p>
                                <p className="font-mono text-xs text-muted-foreground">{row.values.sku}</p>
                                {row.message && <p className={row.status === "error" ? "mt-1 text-xs text-red-700" : "mt-1 text-xs text-muted-foreground"}>{row.message}</p>}
                              </Td>
                              <Td>{row.values.category_name}</Td>
                              <Td align="right" className="tabular-nums">{row.values.price}</Td>
                              <Td>
                                {row.status === "checking" || row.rechecking ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Checking" />
                                ) : (
                                  <Badge tone={s.tone}>{s.label}</Badge>
                                )}
                              </Td>
                            </Tr>
                            {isOpen && canEdit && (
                              <tr className="border-b border-border bg-muted/30">
                                <td colSpan={6} className="px-4 py-3">
                                  <RowEditPanel row={row} onEdit={(column, value) => editRow(row.line, column, value)} onBlur={() => void recheckRow(row.line)} />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </TableShell>
                </div>
              </>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-4">
            {stage === "pick" && (
              <Dialog.Close className={buttonClass({ variant: "ghost" })}>Cancel</Dialog.Close>
            )}
            {stage === "review" && (
              <>
                <button type="button" onClick={reset} className={buttonClass({ variant: "ghost" })}>
                  Choose another file
                </button>
                <button type="button" onClick={() => void startImport()} disabled={ready === 0 || rechecking} className={buttonClass({ variant: "primary" })}>
                  Import {ready} product{ready === 1 ? "" : "s"}
                </button>
              </>
            )}
            {busy && (
              <button type="button" disabled className={buttonClass({ variant: "primary" })}>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {stage === "checking" ? "Checking…" : "Importing…"}
              </button>
            )}
            {stage === "done" && (
              <>
                {failed > 0 && (
                  <button type="button" onClick={downloadFailed} className={buttonClass({ variant: "secondary" })}>
                    <Download className="h-4 w-4" aria-hidden />
                    Download failed rows
                  </button>
                )}
                <button type="button" onClick={reset} className={buttonClass({ variant: "ghost" })}>
                  Import another file
                </button>
                <ButtonLink href="/admin/products" variant="primary">
                  View products
                </ButtonLink>
              </>
            )}
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Fields the import filled in on its own when the sheet left them blank: a guessed variant SKU, and a truncated
// SEO title/description. Shown for review so nothing untrustworthy gets saved silently; editing re-checks the row
// (via the parent's onBlur) since an edit can introduce a clash the first check didn't see.
function RowEditPanel({ row, onEdit, onBlur }: { row: Row; onEdit: (column: string, value: string) => void; onBlur: () => void }) {
  const variantSlots = Object.keys(row.values)
    .map((k) => Number(k.match(/^variant_(\d+)_name$/)?.[1]))
    .filter((n) => Number.isInteger(n) && row.values[`variant_${n}_name`]?.trim())
    .sort((a, b) => a - b)

  const field = (label: string, column: string) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="text"
        value={row.values[column] ?? ""}
        onChange={(e) => onEdit(column, e.target.value)}
        onBlur={onBlur}
        className={inputClass}
      />
    </label>
  )

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Generated automatically because the sheet left these blank. Edit anything before importing.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("SEO title", "meta_title")}
        {field("SEO description", "meta_description")}
      </div>
      {variantSlots.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Variant SKUs</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {variantSlots.map((n) => (
              <label key={n} className="block">
                <span className="mb-1 block text-xs text-muted-foreground">{row.values[`variant_${n}_name`]}</span>
                <input
                  type="text"
                  value={row.values[`variant_${n}_sku`] ?? ""}
                  onChange={(e) => onEdit(`variant_${n}_sku`, e.target.value)}
                  onBlur={onBlur}
                  className={`${inputClass} font-mono`}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Shows how the sheet's columns were understood, so a mis-named header is easy to spot.
function MappingSummary({ mapping }: { mapping: HeaderMapping }) {
  return (
    <details className="rounded-lg border border-border bg-surface px-4 py-2.5 text-[13px]">
      <summary className="cursor-pointer select-none font-medium">
        {mapping.recognized.length} columns matched
        {mapping.ignored.length > 0 && <span className="font-normal text-muted-foreground"> · {mapping.ignored.length} ignored</span>}
      </summary>
      <div className="mt-2 space-y-2 pb-1">
        <p className="leading-6">
          {mapping.recognized.map((m) => (
            <span key={m.column} className="mr-1.5 inline-block rounded border border-border bg-muted/50 px-1.5 py-0.5 text-xs">
              {m.header}
              {m.header !== m.column && <span className="text-muted-foreground"> → {m.column}</span>}
            </span>
          ))}
        </p>
        {mapping.ignored.length > 0 && (
          <p className="text-muted-foreground">
            Ignored (not product fields): {mapping.ignored.join(", ")}
          </p>
        )}
      </div>
    </details>
  )
}
