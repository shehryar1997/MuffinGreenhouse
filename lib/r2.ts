import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

export const PUBLIC_BASE_URL = "https://images.muffinplants.com"

// Cloudflare's dashboard shows both a bare account ID and a full S3 endpoint URL
// (https://<id>.r2.cloudflarestorage.com). Pasting the URL into R2_ACCOUNT_ID
// yields "https://https://..." and a getaddrinfo ENOTFOUND, so accept either.
function resolveAccountId(value: string | undefined) {
  if (!value) return undefined
  return value.match(/[0-9a-f]{32}/i)?.[0] ?? value.trim()
}

export function getR2Client() {
  const accountId = resolveAccountId(process.env.R2_ACCOUNT_ID)
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET_NAME
  const missing = [
    !accountId && "R2_ACCOUNT_ID",
    !accessKeyId && "R2_ACCESS_KEY_ID",
    !secretAccessKey && "R2_SECRET_ACCESS_KEY",
    !bucket && "R2_BUCKET_NAME",
  ].filter(Boolean)
  if (missing.length > 0) {
    throw new Error(`R2 is not configured on the server. Missing env var(s): ${missing.join(", ")}`)
  }
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    // R2 doesn't need the SDK's default CRC32 checksum headers.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  })
  return { client, bucket: bucket! }
}

// Only files created by the admin uploader (products/<uuid>.avif) are ever
// deleted. Manually uploaded / pasted images -- including legacy ones under
// products/<sku>/... or on the old pub-*.r2.dev domain -- are left alone.
const UPLOADED_KEY = /^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.avif$/i

/** The R2 key for a URL the uploader produced, or null for any other URL. */
export function uploadedKeyFromUrl(url: string): string | null {
  const prefix = `${PUBLIC_BASE_URL}/`
  const trimmed = url.trim()
  if (!trimmed.startsWith(prefix)) return null
  const key = trimmed.slice(prefix.length)
  return UPLOADED_KEY.test(key) ? key : null
}

/**
 * Best-effort delete of uploader-created files by URL. Never throws: a failed
 * cleanup must not fail the save that triggered it (the file just stays orphaned).
 */
export async function deleteUploadedImages(urls: string[]): Promise<void> {
  const keys = Array.from(new Set(urls.map(uploadedKeyFromUrl).filter((k): k is string => !!k)))
  if (keys.length === 0) return
  try {
    const { client, bucket } = getR2Client()
    await Promise.all(
      keys.map((Key) =>
        client.send(new DeleteObjectCommand({ Bucket: bucket, Key })).catch((e) => {
          console.error("[r2] failed to delete", Key, e)
        })
      )
    )
  } catch (e) {
    console.error("[r2] cleanup skipped:", e)
  }
}
