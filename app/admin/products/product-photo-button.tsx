"use client"

import { useRef, useState } from "react"
import { Camera, ImageIcon, Loader2 } from "lucide-react"
import { uploadAdminImage } from "@/lib/admin-upload"
import { buttonClass } from "../_components/ui"
import { addProductPhotos } from "./actions"

const MAX_FILES_PER_PICK = 6

type Source = "camera" | "gallery"

// Camera / Gallery photo buttons for a row in the products list, same as the product form's photo
// section. `capture` opens the camera directly on phones (a normal file dialog on desktop); the
// gallery input has none, so phones open the photo library. Picked photos are uploaded and attached
// to the product straight away.
export function ProductPhotoButton({ productId }: { productId: string }) {
  const [busy, setBusy] = useState<{ source: Source; label: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  async function onPick(source: Source, e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = "" // let the same photo be picked again later
    if (picked.length === 0) return
    const files = picked.slice(0, MAX_FILES_PER_PICK)

    setError(null)
    const urls: string[] = []
    let failure: string | null = null
    for (const [i, file] of files.entries()) {
      setBusy({ source, label: files.length > 1 ? `Uploading ${i + 1}/${files.length}…` : "Uploading…" })
      try {
        urls.push(await uploadAdminImage(file, "products"))
      } catch (err) {
        failure = err instanceof Error ? err.message : "Upload failed."
        break
      }
    }

    // Keep whatever did upload, so one bad photo doesn't lose the others.
    if (urls.length > 0) {
      setBusy({ source, label: "Saving…" })
      try {
        const result = await addProductPhotos(productId, urls)
        if (result?.error) failure = result.error
      } catch {
        failure = "Couldn't save the photo. Check your connection and try again."
      }
    }

    const skipped = picked.length - files.length
    setError(failure ?? (skipped > 0 ? `Only the first ${MAX_FILES_PER_PICK} photos were added. Pick the rest again.` : null))
    setBusy(null)
  }

  const pickButton = (source: Source, label: string, Icon: typeof Camera, inputRef: React.RefObject<HTMLInputElement | null>) => {
    const active = busy?.source === source
    return (
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={!!busy}
        className={buttonClass({ size: "sm", className: "disabled:cursor-wait disabled:opacity-60" })}
      >
        {active ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Icon className="h-3.5 w-3.5" aria-hidden />}
        {active ? busy.label : label}
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {pickButton("camera", "Camera", Camera, cameraRef)}
        {pickButton("gallery", "Gallery", ImageIcon, galleryRef)}
      </div>
      {/* No name attribute: these are never part of a form submit. */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPick("camera", e)} />
      <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPick("gallery", e)} />
      {error && (
        <p className="max-w-[16rem] text-right text-xs leading-4 text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
