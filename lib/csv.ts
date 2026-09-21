// Minimal RFC 4180 CSV reader and writer. Pure and dependency-free, so it runs in the browser (admin import
// preview) and on the server alike.

// Byte-order mark: written at the start of exports so Excel reads them as UTF-8, and stripped when reading.
const BOM = String.fromCharCode(0xfeff)

/** Picks the delimiter from the header line: Excel in some locales saves `;` or tabs instead of commas. */
function detectDelimiter(text: string): string {
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 }
  let inQuotes = false
  for (const ch of text) {
    if (ch === '"') inQuotes = !inQuotes
    else if (!inQuotes && (ch === "\n" || ch === "\r")) break
    else if (!inQuotes && ch in counts) counts[ch]++
  }
  const [best, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return count > 0 ? best : ","
}

/**
 * Parses CSV text into rows of cells. Handles quoted cells (embedded delimiters, quotes and line breaks), CRLF/LF
 * line endings and a leading BOM. Blank lines are kept (as a row with one empty cell) so that a row's index still
 * matches its line number in the spreadsheet; the caller decides what to do with them.
 */
export function parseCsv(input: string): string[][] {
  const text = input.replace(new RegExp("^" + BOM), "")
  const delimiter = detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else inQuotes = false
      } else cell += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      row.push(cell)
      cell = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else cell += ch
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

// Spreadsheet apps run a cell starting with = + - @ (or a tab / CR) as a formula. Exports prefix such cells with an
// apostrophe, and reading a file undoes exactly that, so a value survives an export -> import round trip unchanged.
export const neutralizeFormula = (value: string) => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value)
export const restoreFormula = (value: string) => value.replace(/^'(?=[=+\-@\t\r])/, "")

const quoteCell = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)

/** Serialises rows to CSV text (CRLF line endings, UTF-8 BOM so Excel reads non-ASCII text correctly). */
export function toCsv(rows: string[][]): string {
  return BOM + rows.map((r) => r.map(quoteCell).join(",")).join("\r\n") + "\r\n"
}
