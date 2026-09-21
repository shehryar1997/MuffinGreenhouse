import { NextResponse } from "next/server"
import sharp from "sharp"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { PUBLIC_BASE_URL, getR2Client } from "@/lib/r2"
import { checkRateLimit } from "@/lib/rate-limit"

// Public (customer) image upload for reviews. Same pipeline as the admin upload (AVIF in R2),
// but rate limited, smaller, and filed under reviews/ where the orphan sweep never looks.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_EDGE_PX = 1600
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

export async function POST(request: Request) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  let file: File
  try {
    const entry = (await request.formData()).get("file")
    if (!(entry instanceof File) || entry.size === 0) return NextResponse.json({ error: "No image provided." }, { status: 400 })
    file = entry
  } catch {
    return NextResponse.json({ error: "Request must be multipart/form-data." }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "That photo is too large (max 8MB)." }, { status: 413 })

  let avif: Buffer
  try {
    avif = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: MAX_EDGE_PX, height: MAX_EDGE_PX, fit: "inside", withoutEnlargement: true })
      .avif({ quality: 55 })
      .toBuffer()
  } catch {
    return NextResponse.json({ error: "Could not read that file as an image." }, { status: 415 })
  }

  try {
    const r2 = getR2Client()
    const key = `reviews/${crypto.randomUUID()}.avif`
    await r2.client.send(
      new PutObjectCommand({ Bucket: r2.bucket, Key: key, Body: avif, ContentType: "image/avif", CacheControl: "public, max-age=31536000, immutable" })
    )
    return NextResponse.json({ url: `${PUBLIC_BASE_URL}/${key}` })
  } catch (err) {
    console.error("[upload-review-image] R2 upload failed", err)
    return NextResponse.json({ error: "Couldn't upload the photo. Try again, or post without it." }, { status: 502 })
  }
}
