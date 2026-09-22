import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import sharp from "sharp"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { COOKIE_NAME, isValidSessionCookie } from "@/lib/admin-session"
import { PUBLIC_BASE_URL, deleteR2Keys, getR2Client } from "@/lib/r2"
import { SIZED_WIDTHS } from "@/lib/image-urls"

// sharp is a native module -- needs the Node runtime, not Edge.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Five encodes per photo (four AVIF + one JPEG): give slow phones' big photos room to finish.
export const maxDuration = 60

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

  // One upload becomes: the full photo (<= 2000px AVIF), 400/800/1200px AVIF copies for the shop grid and product
  // page (served straight from R2, see lib/image-urls.ts), and a 1200px JPEG for WhatsApp/Facebook link previews.
  let files: { suffix: string; body: Buffer; type: string }[]
  try {
    const source = sharp(Buffer.from(await file.arrayBuffer())).rotate() // EXIF orientation, metadata stripped on output
    const full = await source.clone().resize({ width: MAX_EDGE_PX, height: MAX_EDGE_PX, fit: "inside", withoutEnlargement: true }).avif({ quality: 60 }).toBuffer()
    const copies = await Promise.all(
      SIZED_WIDTHS.map(async (width) => ({
        suffix: `.w${width}.avif`,
        body: await source.clone().resize({ width, height: width, fit: "inside", withoutEnlargement: true }).avif({ quality: 55 }).toBuffer(),
        type: "image/avif",
      }))
    )
    const social = await source
      .clone()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer()
    files = [{ suffix: ".avif", body: full, type: "image/avif" }, ...copies, { suffix: ".og.jpg", body: social, type: "image/jpeg" }]
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

  const base = `${folder}/${crypto.randomUUID()}`
  const key = `${base}.avif`
  try {
    // Copies first, the full photo last: its URL is only returned once every file it depends on exists.
    for (const f of [...files.slice(1), files[0]]) {
      await r2.client.send(
        new PutObjectCommand({
          Bucket: r2.bucket,
          Key: `${base}${f.suffix}`,
          Body: f.body,
          ContentType: f.type,
          CacheControl: "public, max-age=31536000, immutable",
        })
      )
    }
  } catch (e) {
    console.error("[upload-image] R2 upload failed", e)
    await deleteR2Keys([key]) // don't leave half an upload behind (also removes its copies)
    const err = e as { name?: string; message?: string }
    return NextResponse.json(
      { error: `R2 upload failed (${err.name ?? "error"}): ${err.message ?? "unknown"}` },
      { status: 502 }
    )
  }

  return NextResponse.json({ url: `${PUBLIC_BASE_URL}/${key}` })
}
