// Browser-side image upload for the admin panel (product photos, event covers, journal covers).
// Downsizes big phone photos first (Vercel rejects request bodies over ~4.5MB); the server
// (/api/admin/upload-image) then converts to AVIF and stores the file in Cloudflare R2.

export type AdminUploadFolder = "products" | "events" | "journal"

const MAX_EDGE_PX = 2000
const SKIP_DOWNSCALE_BYTES = 3.5 * 1024 * 1024

async function downscaleForUpload(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file) // honours EXIF orientation
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= SKIP_DOWNSCALE_BYTES) {
      bitmap.close()
      return file
    }
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9))
    return blob ?? file
  } catch {
    // Browser can't decode it (e.g. HEIC outside Safari) -- let the server try.
    return file
  }
}

/** Uploads one image and returns its public URL; throws an Error with a user-readable message. */
export async function uploadAdminImage(file: File, folder: AdminUploadFolder = "products"): Promise<string> {
  const body = await downscaleForUpload(file)
  const fd = new FormData()
  fd.append("file", body, file.name)
  fd.append("folder", folder)
  const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd })
  const data: { url?: string; error?: string } | null = await res.json().catch(() => null)
  if (!res.ok || !data?.url) {
    if (res.status === 401) throw new Error("Your admin session has expired. Log in again, then retry.")
    if (res.status === 413) throw new Error("That image is too large to upload. Try a smaller photo.")
    throw new Error(data?.error ?? `Upload failed (HTTP ${res.status}).`)
  }
  return data.url
}
