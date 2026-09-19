import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import sharp from "sharp"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { COOKIE_NAME, isValidSessionCookie } from "@/lib/admin-session"
import { PUBLIC_BASE_URL, getR2Client } from "@/lib/r2"

// sharp is a native module -- needs the Node runtime, not Edge.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Where an upload is filed in the bucket. The daily orphan-image sweep only ever looks inside
// products/, so event and journal covers are never mistaken for abandoned product photos.
const FOLDERS = ["products", "events", "journal"] as const

const MAX_EDGE_PX = 2000
// Vercel rejects request bodies over ~4.5MB before this handler ever runs, so
// the form downscales client-side first. This cap only guards other hosts/callers.
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

export async function POST(request: Request) {
  // proxy.ts only gates /admin/*, not /api/admin/*, so check the session here.
  const cookieStore = await cookies()
  const session = cookieStore.get(COOKIE_NAME)?.value
  if (!(await isValidSessionCookie(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let file: File
  let folder: (typeof FOLDERS)[number] = "products"
  try {
    const form = await request.formData()
    const entry = form.get("file")
    if (!(entry instanceof File) || entry.size === 0) {
      return NextResponse.json({ error: "No image file provided (expected multipart field 'file')." }, { status: 400 })
    }
    file = entry
    const requested = form.get("folder")
    if (typeof requested === "string" && (FOLDERS as readonly string[]).includes(requested)) {
      folder = requested as (typeof FOLDERS)[number]
    }
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

  const key = `${folder}/${crypto.randomUUID()}.avif`
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
