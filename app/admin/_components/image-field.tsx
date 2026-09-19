"use client"

import { useRef, useState } from "react"
import { ImageIcon, Loader2, Trash2 } from "lucide-react"
import { uploadAdminImage, type AdminUploadFolder } from "@/lib/admin-upload"

// A single-image picker for admin forms. The chosen file is uploaded straight away and its public URL is
// submitted with the form as a hidden input named `name` (empty string = no image).
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
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // let the same file be picked again later
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      setUrl(await uploadAdminImage(file, folder))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <span className="block text-sm font-medium text-neutral-700 mb-1">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-start gap-4">
        <div className="relative w-40 h-28 shrink-0 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 overflow-hidden flex items-center justify-center">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary stored URL
            <img src={url} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="h-7 w-7 text-neutral-300" aria-hidden />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-600" aria-label="Uploading" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 text-sm rounded border bg-white hover:bg-neutral-50 disabled:opacity-50"
            >
              {url ? "Replace image" : "Upload image"}
            </button>
            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                disabled={uploading}
                className="px-3 py-1.5 text-sm rounded border bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            )}
          </div>
          {hint && <p className="text-xs text-neutral-500">{hint}</p>}
          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
    </div>
  )
}
