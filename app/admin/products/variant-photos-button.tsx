"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Camera, Check, ImageIcon, Loader2, X } from "lucide-react"
import { uploadAdminImage } from "@/lib/admin-upload"
import { cn } from "@/lib/utils"
import { buttonClass } from "../_components/ui"
import { addProductPhotos, setVariantPhoto } from "./actions"

export type VariantPhotoRow = { id: string; name: string; url: string | null }

type Source = "camera" | "gallery"
type Busy = { id: string; source: Source; label: string }

// Row id used for the product's general photo (shown for every variant, used on the shop grid).
const GENERAL = "general"

// One "Photos" button for a product with several variants. It opens an overlay with a row per variant, each
// with Camera and Gallery buttons, so a photo can be added for every variant straight from the list. Photos go
// through the same upload as everywhere else (downscaled, converted to AVIF, stored in Cloudflare R2). Picking
// a new photo for a variant replaces its old one, and the old file is deleted from R2 on the server.
export function VariantPhotosButton({
  productId,
  productName,
  variants,
  generalUrl,
}: {
  productId: string
  productName: string
  variants: VariantPhotoRow[]
  generalUrl: string | null
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<Busy | null>(null)
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  // Photos saved during this visit, so a row updates instantly instead of waiting for the list to refresh.
  const [saved, setSaved] = useState<Record<string, string>>({})

  const urlFor = (row: VariantPhotoRow) => saved[row.id] ?? row.url
  const done = variants.filter((v) => urlFor(v)).length

  async function onPick(target: string, source: Source, file: File | undefined) {
    if (!file || busy) return
    setErrors((e) => ({ ...e, [target]: null }))
    setBusy({ id: target, source, label: "Uploading…" })
    try {
      const url = await uploadAdminImage(file, "products")
      setBusy({ id: target, source, label: "Saving…" })
      const result = target === GENERAL ? await addProductPhotos(productId, [url]) : await setVariantPhoto(productId, target, url)
      if (result?.error) throw new Error(result.error)
      setSaved((s) => ({ ...s, [target]: url }))
    } catch (err) {
      setErrors((e) => ({ ...e, [target]: err instanceof Error ? err.message : "Couldn't save the photo. Check your connection and try again." }))
    } finally {
      setBusy(null)
    }
  }

  const rows: Array<{ id: string; title: string; hint?: string; url: string | null }> = [
    { id: GENERAL, title: "Main photo", hint: "Shown for every variant and on the shop grid", url: saved[GENERAL] ?? generalUrl },
    ...variants.map((v) => ({ id: v.id, title: v.name, url: urlFor(v) })),
  ]

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !busy && setOpen(next)}>
      <Dialog.Trigger className={buttonClass({ size: "sm" })}>
        <Camera className="h-3.5 w-3.5" aria-hidden />
        Photos
        <span className={cn("tabular-nums", done < variants.length ? "text-amber-700" : "text-forest-700")}>
          {done}/{variants.length}
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        {/* admin-scope: the dialog is portalled to <body>, outside the admin theme, so it brings the tokens with it. */}
        <Dialog.Overlay className="admin-scope fixed inset-0 z-50 bg-ink/50 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="admin-scope fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-xl border border-border bg-surface p-4 text-foreground shadow-lg sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Dialog.Title className="truncate font-sans text-base font-semibold tracking-normal">{productName}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Add a photo for each variant. Picking a new photo replaces the old one.
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={!!busy}
              aria-label="Close"
              className="-mr-1 -mt-1 rounded-md p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden />
            </Dialog.Close>
          </div>

          <ul className="mt-4 divide-y divide-border rounded-md border border-border">
            {rows.map((row) => {
              const rowBusy = busy?.id === row.id
              const error = errors[row.id]
              return (
                <li key={row.id} className="flex items-center gap-3 p-3">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/50">
                    {row.url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail of a stored URL
                      <img src={row.url} alt="" decoding="async" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground/50" aria-label="No photo yet" />
                    )}
                    {rowBusy && (
                      <span className="absolute inset-0 flex items-center justify-center bg-surface/70">
                        <Loader2 className="h-4 w-4 animate-spin text-foreground/70" aria-label={busy?.label} />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.title}</p>
                    {row.hint && <p className="text-xs text-muted-foreground">{row.hint}</p>}
                    {rowBusy ? (
                      <p className="text-xs text-muted-foreground">{busy?.label}</p>
                    ) : saved[row.id] ? (
                      <p className="flex items-center gap-1 text-xs text-forest-700">
                        <Check className="h-3 w-3" aria-hidden />
                        Saved
                      </p>
                    ) : null}
                    {error && (
                      <p role="alert" className="mt-1 text-xs leading-4 text-red-700">
                        {error}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PickButton icon={Camera} label="Camera" capture disabled={!!busy} onFile={(file) => onPick(row.id, "camera", file)} />
                    <PickButton icon={ImageIcon} label="Gallery" disabled={!!busy} onFile={(file) => onPick(row.id, "gallery", file)} />
                  </div>
                </li>
              )
            })}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// A file picker styled as a button. `capture` opens the camera directly on phones (a normal file dialog on
// desktop); without it, phones open the photo library.
function PickButton({
  icon: Icon,
  label,
  capture,
  disabled,
  onFile,
}: {
  icon: typeof Camera
  label: string
  capture?: boolean
  disabled: boolean
  onFile: (file: File | undefined) => void
}) {
  return (
    <label
      className={cn(
        buttonClass({ size: "sm" }),
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled ? "cursor-wait opacity-60" : "cursor-pointer"
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="max-sm:sr-only">{label}</span>
      {/* No name attribute: the file itself is never part of a form submit. */}
      <input
        type="file"
        accept="image/*"
        capture={capture ? "environment" : undefined}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = "" // let the same photo be picked again later
          onFile(file)
        }}
        className="sr-only"
      />
    </label>
  )
}
