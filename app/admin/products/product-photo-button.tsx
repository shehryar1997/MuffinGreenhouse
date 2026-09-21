"use client"

import { useRef, useState } from "react"
import { Camera, Loader2 } from "lucide-react"
import { uploadAdminImage } from "@/lib/admin-upload"
import { buttonClass } from "../_components/ui"
import { addProductPhotos } from "./actions"

const MAX_FILES_PER_PICK = 6

// One-tap photo upload for a row in the products list. `accept="image/*"` without `capture` makes
// phones offer camera, photo library and files in one sheet; on desktop it is a normal file dialog.
// Picked photos are uploaded and attached to the product straight away.
export function ProductPhotoButton({ productId, hasPhotos }: { productId: string; hasPhotos: boolean }) {
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const busy = status !== null

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = "" // let the same photo be picked again later
    if (picked.length === 0) return
    const files = picked.slice(0, MAX_FILES_PER_PICK)

    setError(null)
    const urls: string[] = []
    let uploadError: string | null = null
    for (const [i, file] of files.entries()) {
      setStatus(files.length > 1 ? `Uploading ${i + 1}/${files.length}…` : "Uploading…")
      try {
        urls.push(await uploadAdminImage(file, "products"))
      } catch (err) {
        uploadError = err instanceof Error ? err.message : "Upload failed."
        break
      }
    }

    // Keep whatever did upload, so one bad photo doesn't lose the others.
    if (urls.length > 0) {
      setStatus("Saving…")
      try {
        const result = await addProductPhotos(productId, urls)
        if (result?.error) uploadError = result.error
      } catch {
        uploadError = "Couldn't save the photo. Check your connection and try again."
      }
    }

    const skipped = picked.length - files.length
    setError(uploadError ?? (skipped > 0 ? `Only the first ${MAX_FILES_PER_PICK} photos were added. Pick the rest again.` : null))
    setStatus(null)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={hasPhotos ? "Add another photo" : "Add a photo"}
        className={buttonClass({ size: "sm", className: "disabled:cursor-wait disabled:opacity-60" })}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Camera className="h-3.5 w-3.5" aria-hidden />}
        {status ?? "Photo"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
      {error && (
        <p className="max-w-[16rem] text-right text-xs leading-4 text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
