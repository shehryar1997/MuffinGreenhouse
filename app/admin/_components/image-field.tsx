"use client"

import { useRef, useState } from "react"
import { Camera, ImageIcon, Loader2, Trash2 } from "lucide-react"
import { uploadAdminImage, type AdminUploadFolder } from "@/lib/admin-upload"
import { buttonClass } from "./ui"

type Source = "camera" | "gallery"

// A single-image picker for admin forms. The chosen file is uploaded straight away and its public URL is
// submitted with the form as a hidden input named `name` (empty string = no image). Camera / Gallery work like
// the product form's photo buttons: `capture` opens the camera directly on phones (a normal file dialog on
// desktop); the gallery input has none, so phones open the photo library.
export function ImageField({
  name,
  folder,
  label,
  defaultUrl,
  hint,
}: {
  name: string
  folder: AdminUploadFolder
  label: string
  defaultUrl?: string | null
  hint?: string
}) {
  const [url, setUrl] = useState(defaultUrl ?? "")
  const [uploading, setUploading] = useState<Source | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  async function onPick(source: Source, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // let the same file be picked again later
    if (!file) return
    setUploading(source)
    setError(null)
    try {
      setUrl(await uploadAdminImage(file, folder))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploading(null)
    }
  }

  const pickButton = (source: Source, text: string, Icon: typeof Camera, inputRef: React.RefObject<HTMLInputElement | null>) => (
    <button type="button" onClick={() => inputRef.current?.click()} disabled={!!uploading} className={buttonClass({ size: "sm" })}>
      {uploading === source ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Icon className="h-3.5 w-3.5" aria-hidden />}
      {uploading === source ? "Uploading…" : text}
    </button>
  )

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-foreground">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative flex aspect-[10/7] w-44 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-input bg-muted/50">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary stored URL
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-7 w-7 text-muted-foreground/50" aria-hidden />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
              <Loader2 className="h-5 w-5 animate-spin text-foreground/70" aria-label="Uploading" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {pickButton("camera", "Camera", Camera, cameraRef)}
            {pickButton("gallery", "Gallery", ImageIcon, galleryRef)}
            {url && (
              <button type="button" onClick={() => setUrl("")} disabled={!!uploading} className={buttonClass({ variant: "danger", size: "sm" })}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            )}
          </div>
          {hint && <p className="max-w-sm text-xs leading-5 text-muted-foreground">{hint}</p>}
          {error && (
            <p className="text-xs text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      {/* No name attribute: these are never part of a form submit. */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPick("camera", e)} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick("gallery", e)} />
    </div>
  )
}
