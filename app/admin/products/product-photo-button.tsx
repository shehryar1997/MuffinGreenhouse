"use client"

import { useRef, useState } from "react"
import { Camera, ImageIcon, Loader2 } from "lucide-react"
import { uploadAdminImage } from "@/lib/admin-upload"
import { buttonClass } from "../_components/ui"
import { setVariantPhoto } from "./actions"

type Source = "camera" | "gallery"

// Camera / Gallery photo buttons for a row in the products list whose product has a single variant. The photo is
// that variant's photo: it is uploaded (downscaled, converted to AVIF, stored in Cloudflare R2) and attached
// straight away, replacing the previous one. `capture` opens the camera directly on phones (a normal file dialog
// on desktop); the gallery input has none, so phones open the photo library. Products with several variants use
// the per-variant overlay instead (see variant-photos-button.tsx).
export function ProductPhotoButton({ productId, variantId }: { productId: string; variantId: string }) {
  const [busy, setBusy] = useState<{ source: Source; label: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  async function onPick(source: Source, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // let the same photo be picked again later
    if (!file) return

    setError(null)
    try {
      setBusy({ source, label: "Uploading…" })
      const url = await uploadAdminImage(file, "products")
      setBusy({ source, label: "Saving…" })
      const result = await setVariantPhoto(productId, variantId, url)
      if (result?.error) setError(result.error)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the photo. Check your connection and try again.")
    } finally {
      setBusy(null)
    }
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
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick("gallery", e)} />
      {error && (
        <p className="max-w-[16rem] text-right text-xs leading-4 text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
