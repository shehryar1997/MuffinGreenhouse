import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import sharp from "sharp"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { COOKIE_NAME, isValidSessionCookie } from "@/lib/admin-session"

// sharp is a native module -- needs the Node runtime, not Edge.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PUBLIC_BASE_URL = "https://images.muffinplants.com"
const MAX_EDGE_PX = 2000
// Vercel rejects request bodies over ~4.5MB before this handler ever runs, so
// the form downscales client-side first. This cap only guards other hosts/callers.
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID
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

export async function POST(request: Request) {
  // Middleware only gates /admin/*, not /api/admin/*, so check the session here.
  const session = cookies().get(COOKIE_NAME)?.value
  if (!(await isValidSessionCookie(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let file: File
  try {
    const form = await request.formData()
    const entry = form.get("file")
    if (!(entry instanceof File) || entry.size === 0) {
      return NextResponse.json({ error: "No image file provided (expected multipart field 'file')." }, { status: 400 })
    }
    file = entry
  } catch {
    return NextResponse.json({ error: "Request must be multipart/form-data." }, { status: 400 })
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 12MB)." }, { status: 413 })
  }

  let avif: Buffer
  try {
    avif = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate() // apply EXIF orientation (phone cameras), then strip metadata on output
      .resize({ width: MAX_EDGE_PX, height: MAX_EDGE_PX, fit: "inside", withoutEnlargement: true })
      .avif({ quality: 60 })
      .toBuffer()
  } catch {
    return NextResponse.json({ error: "Could not read that file as an image." }, { status: 415 })
  }

  let r2: ReturnType<typeof getR2Client>
  try {
    r2 = getR2Client()
  } catch (e) {
    console.error("[upload-image]", e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }

  const key = `products/${crypto.randomUUID()}.avif`
  try {
    await r2.client.send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: avif,
        ContentType: "image/avif",
        CacheControl: "public, max-age=31536000, immutable",
      })
    )
  } catch (e) {
    console.error("[upload-image] R2 upload failed", e)
    const err = e as { name?: string; message?: string }
    return NextResponse.json(
      { error: `R2 upload failed (${err.name ?? "error"}): ${err.message ?? "unknown"}` },
      { status: 502 }
    )
  }

  return NextResponse.json({ url: `${PUBLIC_BASE_URL}/${key}` })
}
