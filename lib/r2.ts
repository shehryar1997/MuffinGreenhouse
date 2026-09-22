import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"

import { PUBLIC_BASE_URL } from "@/lib/r2-url"
import { uploadSiblingKeys } from "@/lib/image-urls"
export { PUBLIC_BASE_URL }
// The bucket's public r2.dev address -- older product images were saved with this host.
const LEGACY_PUBLIC_BASE_URL = "https://pub-81f46d28c378411d9acc02aef58b2bee.r2.dev"
const PUBLIC_URL_PREFIXES = [`${PUBLIC_BASE_URL}/`, `${LEGACY_PUBLIC_BASE_URL}/`]

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

// Two levels of "is this file ours to delete":
//  * productKeyFromUrl  -- anything under products/ on our public hosts. Used when an admin
//    explicitly removes/replaces a product photo (or deletes a product), and only after
//    checking nothing else in the database still points at the file. Covers legacy
//    photos (products/<sku>/..., the old r2.dev host) as well as new uploads.
//  * uploadedKeyFromUrl -- only files the admin uploader itself creates
//    (products/<uuid>.avif). The orphan sweeper is restricted to these, because
//    anything else may be a manually uploaded file that hasn't been attached yet.
const UPLOADED_KEY = /^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.avif$/i

function keyFromUrl(url: string): string | null {
  const trimmed = (url ?? "").trim()
  const prefix = PUBLIC_URL_PREFIXES.find((p) => trimmed.startsWith(p))
  if (!prefix) return null
  const rawKey = trimmed.slice(prefix.length).split(/[?#]/)[0]
  let key: string
  try {
    key = decodeURIComponent(rawKey)
  } catch {
    return null
  }
  if (!key || key.split("/").some((part) => part === ".." || part === "." || part === "")) return null
  return key
}

/** The R2 key for a file the admin uploader produced (products/<uuid>.avif), or null. */
export function uploadedKeyFromUrl(url: string): string | null {
  const key = keyFromUrl(url)
  return key && UPLOADED_KEY.test(key) ? key : null
}

/** The R2 key for any file under products/ on our public hosts, or null. */
export function productKeyFromUrl(url: string): string | null {
  const key = keyFromUrl(url)
  return key && key.startsWith("products/") ? key : null
}

/** Every public URL a stored key may have been saved under (current + legacy host). */
export function urlVariantsForKey(key: string): string[] {
  return PUBLIC_URL_PREFIXES.map((prefix) => `${prefix}${key}`)
}

/**
 * Best-effort delete of files by key. Never throws: a failed cleanup must not fail
 * the save that triggered it (the file just stays orphaned until the sweeper runs).
 */
export async function deleteR2Keys(keys: string[]): Promise<number> {
  // An uploaded photo has sized copies and a social JPEG next to it: they go with it.
  const unique = Array.from(new Set(keys.flatMap(uploadSiblingKeys)))
  if (unique.length === 0) return 0
  let deleted = 0
  try {
    const { client, bucket } = getR2Client()
    await Promise.all(
      unique.map((Key) =>
        client
          .send(new DeleteObjectCommand({ Bucket: bucket, Key }))
          .then(() => {
            deleted++
          })
          .catch((e) => {
            console.error("[r2] failed to delete", Key, e)
          })
      )
    )
  } catch (e) {
    console.error("[r2] cleanup skipped:", e)
  }
  return deleted
}

/** Lists uploader-created files (products/<uuid>.avif) with their last-modified time. */
export async function listUploadedObjects(): Promise<Array<{ key: string; lastModified: Date }>> {
  const { client, bucket } = getR2Client()
  const found: Array<{ key: string; lastModified: Date }> = []
  let ContinuationToken: string | undefined
  do {
    const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: "products/", ContinuationToken }))
    for (const object of page.Contents ?? []) {
      if (object.Key && object.LastModified && UPLOADED_KEY.test(object.Key)) {
        found.push({ key: object.Key, lastModified: object.LastModified })
      }
    }
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (ContinuationToken)
  return found
}
