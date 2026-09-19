"use client"

import { useRef, useState } from "react"
import { Camera, Loader2 } from "lucide-react"
import { findProductsByName, type PrefillProduct } from "./actions"

const inputClass = "w-full border rounded px-3 py-2 text-sm"
const highlightInputClass = "w-full border-2 border-[#E85D2C] rounded px-3 py-2 text-sm bg-orange-50"

type Lookups = {
  categories: string[]
  useCaseTags: string[]
  moodTags: string[]
}

type ExistingProduct = {
  sku: string
  name: string
  slug: string
  description: string
  short_description: string | null
  category_name: string
  price: number
  compare_at_price: number | null
  stock_count: number
  low_stock_threshold: number
  difficulty: string
  light_requirement: string
  water_requirement: string
  size: string
  is_new_arrival: boolean
  is_pet_safe: boolean
  is_featured: boolean
  published_at: string | null
  meta_title: string | null
  meta_description: string | null
  light: string | null
  water: string | null
  humidity: string | null
  temperature: string | null
  soil: string | null
  fertilizer: string | null
  toxicity: string | null
  light_summary: string | null
  water_summary: string | null
  pet_safe_note: string | null
  box_height_cm: number | null
  box_width_cm: number | null
  box_breadth_cm: number | null
  weight_kg: number | null
  use_case_tags: string[]
  mood_tags: string[]
  images?: { url: string; alt_text: string }[]
  variants?: { name: string; sku: string; price: number; stock_count: number }[]
}

// Fields copied from an existing product when prefilling by name. sku and slug
// are intentionally absent (both UNIQUE in the DB); image_url is never touched.
const PREFILL_VALUE_FIELDS = [
  "category_name",
  "description",
  "short_description",
  "price",
  "compare_at_price",
  "stock_count",
  "low_stock_threshold",
  "difficulty",
  "light_requirement",
  "water_requirement",
  "size",
  "meta_title",
  "meta_description",
  "light",
  "water",
  "humidity",
  "temperature",
  "soil",
  "fertilizer",
  "toxicity",
  "light_summary",
  "water_summary",
  "pet_safe_note",
  "box_height_cm",
  "box_width_cm",
  "box_breadth_cm",
  "weight_kg",
] as const
const PREFILL_CHECK_FIELDS = ["is_new_arrival", "is_pet_safe"] as const
const PREFILL_TAG_FIELDS = ["use_case_tags", "mood_tags"] as const

type ImageRowState = { id: string; url: string; alt_text: string }
let imageRowSeq = 0
const newImageRow = (url = "", alt_text = ""): ImageRowState => ({ id: `img-${++imageRowSeq}`, url, alt_text })

type PrefillNote = { source: string; sku: string; filled: number; kept: string[] }

export function ProductForm({
  lookups,
  product,
  action,
}: {
  lookups: Lookups
  product?: ExistingProduct
  action: (formData: FormData) => void
}) {
  const [images, setImages] = useState<ImageRowState[]>(() =>
    product?.images?.length ? product.images.map((i) => newImageRow(i.url, i.alt_text)) : [newImageRow()]
  )
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set())
  const [variants, setVariants] = useState(product?.variants ?? [])
  const [categoryName, setCategoryName] = useState(product?.category_name ?? "")
  const isOtherEquipment = categoryName === "Other Equipment"

  // --- Autofill from an existing product by name (new products only) ---
  const formRef = useRef<HTMLFormElement>(null)
  // Names of fields the user has edited. Programmatic writes don't fire change
  // events, so this only ever contains real user edits -- prefill never touches them.
  const touched = useRef<Set<string>>(new Set())
  const lastLookup = useRef("")
  const lookupSeq = useRef(0)
  const [lookupBusy, setLookupBusy] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<PrefillProduct[] | null>(null)
  const [prefillNote, setPrefillNote] = useState<PrefillNote | null>(null)

  function applyPrefill(src: PrefillProduct) {
    const form = formRef.current
    if (!form) return
    let filled = 0
    const kept: string[] = []

    for (const name of PREFILL_VALUE_FIELDS) {
      if (touched.current.has(name)) {
        kept.push(name)
        continue
      }
      const el = form.elements.namedItem(name)
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) continue
      const v = src[name]
      el.value = v == null ? "" : String(v)
      if (name === "category_name") setCategoryName(el.value)
      filled++
    }
    for (const name of PREFILL_CHECK_FIELDS) {
      if (touched.current.has(name)) {
        kept.push(name)
        continue
      }
      const el = form.querySelector<HTMLInputElement>(`input[name="${name}"]`)
      if (!el) continue
      el.checked = !!src[name]
      filled++
    }
    for (const name of PREFILL_TAG_FIELDS) {
      if (touched.current.has(name)) {
        kept.push(name)
        continue
      }
      const selected = new Set(src[name] ?? [])
      form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`).forEach((box) => {
        box.checked = selected.has(box.value)
      })
      filled++
    }

    setCandidates(null)
    setPrefillNote({ source: src.name, sku: src.sku, filled, kept })
  }

  async function handleNameBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (product) return // editing an existing product: never prefill
    const raw = e.currentTarget.value
    const key = raw.trim().replace(/\s+/g, " ").toLowerCase()
    if (!key || key === lastLookup.current) return
    lastLookup.current = key
    const seq = ++lookupSeq.current
    setLookupBusy(true)
    setLookupError(null)
    setCandidates(null)
    setPrefillNote(null)
    try {
      const { matches, error } = await findProductsByName(raw)
      if (seq !== lookupSeq.current) return // a newer lookup superseded this one
      if (error) throw new Error(error)
      if (matches.length === 1) applyPrefill(matches[0])
      else if (matches.length > 1) setCandidates(matches)
    } catch (err) {
      if (seq !== lookupSeq.current) return
      lastLookup.current = "" // allow retrying the same name
      setLookupError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      if (seq === lookupSeq.current) setLookupBusy(false)
    }
  }

  function setRowUploading(id: string, busy: boolean) {
    setUploadingIds((prev) => {
      const next = new Set(prev)
      if (busy) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <form
      ref={formRef}
      action={action}
      onChange={(e) => {
        const name = (e.target as HTMLInputElement).name
        if (name) touched.current.add(name)
      }}
      className="space-y-8 bg-white rounded-lg border p-6"
    >
      <section className="space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Basics</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Product Name">
            <input name="name" defaultValue={product?.name} required onBlur={handleNameBlur} className={inputClass} />
          </Field>
          <Field label="SKU">
            <input name="sku" defaultValue={product?.sku} required className={inputClass} />
          </Field>
          <Field label="Slug">
            <input name="slug" defaultValue={product?.slug} required className={inputClass} />
          </Field>
          <Field label="Category">
            <select
              name="category_name"
              defaultValue={product?.category_name ?? ""}
              required
              className={inputClass}
              onChange={(e) => setCategoryName(e.target.value)}
            >
              <option value="">Select...</option>
              {lookups.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {lookupBusy && <p className="text-xs text-neutral-500">Checking existing products…</p>}
        {lookupError && (
          <p role="alert" className="text-xs text-red-600">
            Couldn&apos;t check existing products: {lookupError}
          </p>
        )}
        {candidates && (
          <div className="border rounded p-3 bg-orange-50 text-sm space-y-2">
            <p className="font-medium">
              {candidates.length} existing products share this name. Copy details from one? (SKU, slug and image are never copied.)
            </p>
            <ul className="space-y-1">
              {candidates.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => applyPrefill(c)}
                    className="w-full text-left border rounded bg-white px-3 py-2 hover:border-[#E85D2C]"
                  >
                    <span className="font-medium">{c.sku}</span>
                    <span className="text-neutral-600">
                      {" "}
                      · {c.category_name ?? "no category"} · size {c.size ?? "?"} · PKR {c.price} · stock {c.stock_count ?? 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setCandidates(null)} className="text-xs text-neutral-600 underline">
              None — start blank
            </button>
          </div>
        )}
        {prefillNote && (
          <div className="border rounded p-3 bg-green-50 text-sm flex items-start justify-between gap-3">
            <p>
              Filled {prefillNote.filled} fields from existing product “{prefillNote.source}” ({prefillNote.sku}). All are editable.
              {prefillNote.kept.length > 0 && (
                <> Kept what you had already edited: {prefillNote.kept.map((k) => k.replace(/_/g, " ")).join(", ")}.</>
              )}{" "}
              <strong>SKU and slug were not copied</strong> — both must be unique, so set new ones.
            </p>
            <button type="button" onClick={() => setPrefillNote(null)} className="text-xs text-neutral-600 underline shrink-0">
              Dismiss
            </button>
          </div>
        )}
        <Field label="Short Description">
          <input name="short_description" defaultValue={product?.short_description ?? ""} className={inputClass} />
        </Field>
        <Field label="Full Description">
          <textarea name="description" defaultValue={product?.description} required rows={3} className={inputClass} />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Pricing & Stock</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="Price (PKR)">
            <input type="number" name="price" defaultValue={product?.price} required className={inputClass} />
          </Field>
          <Field label="Compare-at Price">
            <input type="number" name="compare_at_price" defaultValue={product?.compare_at_price ?? ""} className={inputClass} />
          </Field>
          <Field label="Stock Count">
            <input type="number" name="stock_count" defaultValue={product?.stock_count ?? 0} required className={inputClass} />
          </Field>
          <Field label="Low Stock Threshold">
            <input
              type="number"
              name="low_stock_threshold"
              defaultValue={product?.low_stock_threshold ?? 10}
              required
              className={inputClass}
            />
          </Field>
        </div>
        <p className="text-xs text-neutral-500">Stock status (In Stock / Low Stock / Out of Stock) is derived automatically.</p>
        <div className="grid grid-cols-4 gap-4">
          <Field label="Box Height (cm)">
            <input type="number" name="box_height_cm" defaultValue={product?.box_height_cm ?? ""} className={inputClass} />
          </Field>
          <Field label="Box Width (cm)">
            <input type="number" name="box_width_cm" defaultValue={product?.box_width_cm ?? ""} className={inputClass} />
          </Field>
          <Field label="Box Breadth (cm)">
            <input type="number" name="box_breadth_cm" defaultValue={product?.box_breadth_cm ?? ""} className={inputClass} />
          </Field>
          <Field label={isOtherEquipment ? "Weight (kg) *" : "Weight (kg)"}>
            <input type="number" name="weight_kg" defaultValue={product?.weight_kg ?? ""} step="0.01" min="0" className={isOtherEquipment ? highlightInputClass : inputClass} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Plant Attributes</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="Difficulty">
            <select name="difficulty" defaultValue={product?.difficulty ?? "beginner"} className={inputClass}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </Field>
          <Field label="Light Requirement">
            <select name="light_requirement" defaultValue={product?.light_requirement ?? "medium"} required className={inputClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="bright">Bright</option>
              <option value="full_sun">Full Sun</option>
            </select>
          </Field>
          <Field label="Water Requirement">
            <select name="water_requirement" defaultValue={product?.water_requirement ?? "medium"} className={inputClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
          <Field label="Size">
            <select name="size" defaultValue={product?.size ?? "medium"} className={inputClass}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </Field>
        </div>
        <div className="flex gap-6 flex-wrap">
          <Checkbox name="is_new_arrival" label="New Arrival?" defaultChecked={product?.is_new_arrival} />
          <Checkbox name="is_pet_safe" label="Pet Safe?" defaultChecked={product?.is_pet_safe} />
          <Checkbox name="is_featured" label="Featured?" defaultChecked={product?.is_featured} />
          <Checkbox name="published" label="Published?" defaultChecked={!!product?.published_at} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Use Case & Mood Tags</h2>
        <div>
          <p className="text-sm font-medium mb-2">Use Case Tags</p>
          <div className="flex flex-wrap gap-4">
            {lookups.useCaseTags.map((tag) => (
              <label key={tag} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="use_case_tags" value={tag} defaultChecked={product?.use_case_tags?.includes(tag)} />
                {tag}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Mood Tags</p>
          <div className="flex flex-wrap gap-4">
            {lookups.moodTags.map((tag) => (
              <label key={tag} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="mood_tags" value={tag} defaultChecked={product?.mood_tags?.includes(tag)} />
                {tag}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Care Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Light Summary (short)">
            <input name="light_summary" defaultValue={product?.light_summary ?? ""} className={inputClass} />
          </Field>
          <Field label="Water Summary (short)">
            <input name="water_summary" defaultValue={product?.water_summary ?? ""} className={inputClass} />
          </Field>
        </div>
        <Field label="Light (detail)">
          <textarea name="light" defaultValue={product?.light ?? ""} rows={2} className={inputClass} />
        </Field>
        <Field label="Water (detail)">
          <textarea name="water" defaultValue={product?.water ?? ""} rows={2} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Humidity">
            <textarea name="humidity" defaultValue={product?.humidity ?? ""} rows={2} className={inputClass} />
          </Field>
          <Field label="Temperature">
            <textarea name="temperature" defaultValue={product?.temperature ?? ""} rows={2} className={inputClass} />
          </Field>
          <Field label="Soil">
            <textarea name="soil" defaultValue={product?.soil ?? ""} rows={2} className={inputClass} />
          </Field>
          <Field label="Fertilizer">
            <textarea name="fertilizer" defaultValue={product?.fertilizer ?? ""} rows={2} className={inputClass} />
          </Field>
        </div>
        <Field label="Toxicity">
          <textarea name="toxicity" defaultValue={product?.toxicity ?? ""} rows={2} className={inputClass} />
        </Field>
        <Field label="Pet Safe Note">
          <input name="pet_safe_note" defaultValue={product?.pet_safe_note ?? ""} className={inputClass} />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">SEO</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Meta Title">
            <input name="meta_title" defaultValue={product?.meta_title ?? ""} className={inputClass} />
          </Field>
          <Field label="Meta Description">
            <input name="meta_description" defaultValue={product?.meta_description ?? ""} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Images</h2>
        <p className="text-xs text-neutral-500">
          Use the camera button to take or choose a photo (converted to AVIF and stored in Cloudflare R2), or paste an image URL
          yourself. First row is the primary photo.
        </p>
        {images.map((img) => (
          <ImageRow
            key={img.id}
            initialUrl={img.url}
            initialAlt={img.alt_text}
            onUploadingChange={(busy) => setRowUploading(img.id, busy)}
            onRemove={() => {
              setRowUploading(img.id, false)
              setImages((rows) => rows.filter((r) => r.id !== img.id))
            }}
          />
        ))}
        <button type="button" onClick={() => setImages((rows) => [...rows, newImageRow()])} className="text-sm text-[#E85D2C]">
          + Add image
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Variants (optional)</h2>
        {variants.map((v, i) => (
          <div key={i} className="flex gap-3 items-start">
            <input name="variant_name" defaultValue={v.name} placeholder='e.g. Medium - 8" pot' className={`${inputClass} flex-1`} />
            <input name="variant_sku" defaultValue={v.sku} placeholder="SKU" className={`${inputClass} flex-1`} />
            <input type="number" name="variant_price" defaultValue={v.price} placeholder="Price" className={`${inputClass} w-28`} />
            <input type="number" name="variant_stock" defaultValue={v.stock_count} placeholder="Stock" className={`${inputClass} w-24`} />
            <button
              type="button"
              onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
              className="text-red-600 text-sm px-2 py-2 shrink-0"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setVariants([...variants, { name: "", sku: "", price: 0, stock_count: 0 }])}
          className="text-sm text-[#E85D2C]"
        >
          + Add variant
        </button>
      </section>

      <div className="pt-4 border-t flex justify-end">
        <button
          type="submit"
          disabled={uploadingIds.size > 0}
          className="bg-[#E85D2C] text-white rounded px-6 py-3 font-medium disabled:opacity-50"
        >
          {uploadingIds.size > 0 ? "Uploading image…" : product ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
    </label>
  )
}

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  )
}

const MAX_EDGE_PX = 2000
// Vercel rejects request bodies over ~4.5MB, and phone photos are often bigger,
// so shrink in the browser first. The server still converts to AVIF.
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

function ImageRow({
  initialUrl,
  initialAlt,
  onUploadingChange,
  onRemove,
}: {
  initialUrl: string
  initialAlt: string
  onUploadingChange: (busy: boolean) => void
  onRemove: () => void
}) {
  // image_url stays a plain editable text input: pasting a URL by hand works
  // exactly as before; the camera button just fills it in.
  const [url, setUrl] = useState(initialUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-selecting the same file
    if (!file) return
    setUploading(true)
    onUploadingChange(true)
    setError(null)
    try {
      const body = await downscaleForUpload(file)
      const fd = new FormData()
      fd.append("file", body, file.name)
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd })
      const data: { url?: string; error?: string } | null = await res.json().catch(() => null)
      if (!res.ok || !data?.url) {
        if (res.status === 401) throw new Error("Your admin session has expired. Log in again, then retry.")
        if (res.status === 413) throw new Error("That image is too large to upload. Try a smaller photo.")
        throw new Error(data?.error ?? `Upload failed (HTTP ${res.status}).`)
      }
      setUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploading(false)
      onUploadingChange(false)
    }
  }

  const showPreview = /^https?:\/\//i.test(url) && brokenUrl !== url

  return (
    <div className="space-y-2">
      <div className="flex gap-3 items-start">
        <input
          name="image_url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://images.muffinplants.com/..."
          className={`${inputClass} flex-1`}
        />
        <label
          className={`shrink-0 inline-flex items-center gap-1.5 border rounded px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-[#E85D2C] ${
            uploading ? "opacity-60 cursor-wait" : "cursor-pointer hover:border-[#E85D2C]"
          }`}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Camera"}
          {/* No name attribute: the file itself must not be submitted with the form. */}
          <input type="file" accept="image/*" capture="environment" disabled={uploading} onChange={handleFile} className="sr-only" />
        </label>
        <input name="image_alt" defaultValue={initialAlt} placeholder="Alt text" className={`${inputClass} flex-1`} />
        <button type="button" onClick={onRemove} className="text-red-600 text-sm px-2 py-2 shrink-0">
          Remove
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      {showPreview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Preview"
          onError={() => setBrokenUrl(url)}
          className="h-20 w-20 object-cover rounded border bg-neutral-50"
        />
      )}
      {/^https?:\/\//i.test(url) && brokenUrl === url && <p className="text-xs text-neutral-500">Preview unavailable for this URL.</p>}
    </div>
  )
}
