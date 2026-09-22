"use client"

import { useRef, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { FileSpreadsheet, Loader2, RefreshCw, X } from "lucide-react"
import { parseCsv } from "@/lib/csv"
import { isBlankRecord, mapHeaders, rowToRecord, type ImportRecord } from "@/lib/product-import"
import { Alert, Badge, TableShell, Td, Th, Thead, Tr, buttonClass, type Tone } from "../_components/ui"
import { updateProductsFromRows, type UpdateRowResult } from "./actions"

type Status = "checking" | "ready" | "same" | "error" | "updated"
type Row = { line: number; values: ImportRecord; status: Status; message?: string; changes?: string[] }
type Stage = "pick" | "checking" | "review" | "saving" | "done"

const BATCH = 20
const MAX_FILE_BYTES = 2 * 1024 * 1024
const MAX_ROWS = 1000
const LABEL: Record<Status, { label: string; tone: Tone }> = {
  checking: { label: "Checking…", tone: "neutral" },
  ready: { label: "Will change", tone: "info" },
  same: { label: "No change", tone: "neutral" },
  error: { label: "Error", tone: "danger" },
  updated: { label: "Updated", tone: "success" },
}

// Bulk price / stock / published changes from a spreadsheet: Export CSV, edit the numbers, upload it here.
// Rows are matched by SKU; each row shows exactly what will change before anything is saved.
export function ProductCsvUpdate() {
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<Stage>("pick")
  const [rows, setRows] = useState<Row[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const fileInput = useRef<HTMLInputElement>(null)
  const busy = stage === "checking" || stage === "saving"
  const count = (s: Status) => rows.filter((r) => r.status === s).length

  function reset() {
    setStage("pick")
    setRows([])
    setFileError(null)
    setFileName("")
  }

  function apply(results: UpdateRowResult[], okStatus: Status) {
    const byLine = new Map(results.map((r) => [r.line, r]))
    setRows((current) =>
      current.map((row) => {
        const res = byLine.get(row.line)
        if (!res) return row
        if (!res.ok) return { ...row, status: "error", message: res.message, changes: undefined }
        const nothing = !res.changes || res.changes.length === 0
        return { ...row, status: nothing ? "same" : okStatus, message: res.message, changes: res.changes }
      })
    )
  }

  async function run(targets: Row[], dryRun: boolean) {
    for (let i = 0; i < targets.length; i += BATCH) {
      const batch = targets.slice(i, i + BATCH)
      try {
        const { results, error } = await updateProductsFromRows(batch.map((r) => ({ line: r.line, values: r.values })), dryRun)
        if (error) throw new Error(error)
        apply(results, dryRun ? "ready" : "updated")
      } catch (err) {
        apply(batch.map((r) => ({ line: r.line, ok: false, message: err instanceof Error ? err.message : "Connection problem" })), "ready")
      }
    }
  }

  async function handleFile(file: File) {
    setFileError(null)
    if (file.size > MAX_FILE_BYTES) return setFileError("That file is larger than 2 MB. Split it into smaller files.")
    const table = parseCsv(await file.text())
    const map = mapHeaders(table[0] ?? [])
    if (!map.columns.includes("sku")) return setFileError("The file needs a “sku” column: rows are matched to products by SKU.")
    const parsed: Row[] = []
    table.slice(1).forEach((cells, i) => {
      const values = rowToRecord(map.columns, cells)
      if (!isBlankRecord(values)) parsed.push({ line: i + 2, values, status: "checking" })
    })
    if (parsed.length === 0) return setFileError("No rows found under the header row.")
    if (parsed.length > MAX_ROWS) return setFileError(`This file has ${parsed.length} rows; the limit is ${MAX_ROWS}. Split it into smaller files.`)
    setFileName(file.name)
    setRows(parsed)
    setStage("checking")
    await run(parsed, true)
    setStage("review")
  }

  async function save() {
    setStage("saving")
    await run(rows.filter((r) => r.status === "ready"), false)
    setStage("done")
  }

  const ready = count("ready")
  const errors = count("error")

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
        <RefreshCw className="h-4 w-4" aria-hidden />
        Update from CSV
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="admin-scope fixed inset-0 z-50 bg-ink/50" />
        <Dialog.Content
          onInteractOutside={(e) => e.preventDefault()}
          className="admin-scope fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-border bg-surface text-foreground shadow-lg"
        >
          <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div>
              <Dialog.Title className="text-base font-semibold">Update prices and stock from a spreadsheet</Dialog.Title>
              <Dialog.Description className="mt-1 text-[13px] leading-5 text-muted-foreground">
                Export CSV, change prices, stock or the published column, then upload the file here. Rows are matched by SKU and
                empty cells are left as they are. Nothing is saved until you confirm.
              </Dialog.Description>
            </div>
            <Dialog.Close disabled={busy} aria-label="Close" className={buttonClass({ variant: "ghost", size: "sm", className: "-mr-2 -mt-1 px-2" })}>
              <X className="h-4 w-4" aria-hidden />
            </Dialog.Close>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {stage === "pick" && (
              <>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-input px-6 py-10 text-sm text-muted-foreground hover:border-primary"
                >
                  <FileSpreadsheet className="h-6 w-6" aria-hidden />
                  Choose a CSV file
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  aria-label="CSV file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ""
                    if (file) void handleFile(file)
                  }}
                />
                {fileError && <Alert tone="danger">{fileError}</Alert>}
              </>
            )}

            {stage !== "pick" && (
              <>
                <p className="text-sm">
                  <span className="font-medium">{fileName}</span> · {rows.length} rows
                  {stage === "checking" && <Loader2 className="ml-2 inline h-4 w-4 animate-spin" aria-label="Checking" />}
                </p>
                {stage === "done" && (
                  <Alert tone={errors > 0 ? "warning" : "success"} title={`${count("updated")} products updated${errors > 0 ? `, ${errors} rows with errors` : ""}.`} />
                )}
                <TableShell minWidth="min-w-[560px]">
                  <Thead>
                    <tr>
                      <Th>Row</Th>
                      <Th>SKU</Th>
                      <Th>Changes</Th>
                      <Th>Status</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {rows.map((r) => (
                      <Tr key={r.line}>
                        <Td className="tabular-nums text-muted-foreground">{r.line}</Td>
                        <Td className="font-mono text-xs">{r.values.sku}</Td>
                        <Td className="text-[13px]">
                          {r.changes && r.changes.length > 0 ? r.changes.join("; ") : <span className="text-muted-foreground">{r.message ?? "—"}</span>}
                          {r.status === "error" && r.message && r.changes && <span className="block text-red-700">{r.message}</span>}
                        </Td>
                        <Td>
                          <Badge tone={LABEL[r.status].tone}>{LABEL[r.status].label}</Badge>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableShell>
              </>
            )}
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            {stage === "review" && (
              <>
                <button type="button" onClick={reset} className={buttonClass({ variant: "ghost" })}>Choose another file</button>
                <button type="button" onClick={() => void save()} disabled={ready === 0} className={buttonClass({ variant: "primary" })}>
                  {ready === 0 ? "Nothing to update" : `Update ${ready} product${ready === 1 ? "" : "s"}`}
                </button>
              </>
            )}
            {stage === "saving" && (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Saving…
              </span>
            )}
            {stage === "done" && (
              <Dialog.Close className={buttonClass({ variant: "primary" })}>Close</Dialog.Close>
            )}
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
