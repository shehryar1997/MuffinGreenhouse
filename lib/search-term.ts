// User input interpolated into a PostgREST `.or("col.ilike.%term%,...")` filter
// string can inject extra filter clauses (`,`, `(`, `)` are syntax there) and
// LIKE wildcards. Keep letters, digits, whitespace and a few email/phone
// characters; drop everything else. Length-capped as well.
export function sanitizeSearchTerm(raw: string | undefined | null): string {
  if (!raw) return ""
  return raw
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s@.+_-]/gu, "")
    .trim()
    .slice(0, 80)
}
