// Shared by the admin "delete selected" server actions.

/** What a bulk delete hands back. `failures` are ready-to-show sentences, one per item that was kept. */
export type BulkDeleteResult = { deleted: number; failures: string[]; error?: string }

/** The list pages send ids in batches of this size, so no single request runs long. The server enforces the cap. */
export const BULK_BATCH_SIZE = 10
export const MAX_BULK_IDS = 50

/** Validates the ids a client sent: strings only, no duplicates, at most MAX_BULK_IDS. Null means "reject the request". */
export function cleanBulkIds(ids: unknown): string[] | null {
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string" || id.length === 0)) return null
  const unique = [...new Set(ids as string[])]
  return unique.length > 0 && unique.length <= MAX_BULK_IDS ? unique : null
}

export const BAD_BULK_REQUEST: BulkDeleteResult = { deleted: 0, failures: [], error: "Nothing valid was selected. Refresh the page and try again." }
