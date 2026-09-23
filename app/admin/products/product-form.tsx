"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { Camera, ChevronDown, Loader2, Plus } from "lucide-react"
import { isNonPlantCategoryName } from "@/lib/product-categories"
import { isMangaveCategory } from "@/lib/shipping"
import { uploadAdminImage } from "@/lib/admin-upload"
import { publishBlocker } from "@/lib/product-photos"
import { cn, slugify } from "@/lib/utils"
import { RichEditor } from "../journal/rich-editor"
import { Alert, CheckField, Field, FormActions, FormSection, buttonClass, inputClass, textareaClass } from "../_components/ui"
import { findProductsByName, type PrefillProduct, type ProductActionResult } from "./actions"

// Weight is mandatory for Tools & Equipment, so its input is tinted to stand out.
const highlightInputClass = cn(inputClass, "border-primary bg-clay-50")

type Lookups = {
  categories: string[]
  useCaseTags: string[]
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
  is_imported: boolean
  is_hard_leaf: boolean
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
  sort_position?: number | null
  use_case_tags: string[]
  // Photos in order; each belongs to a variant (variant_id null = a legacy photo from before variants owned photos).
  images?: { url: string; variant_id?: string | null }[]
  variants?: VariantSource[]
  card_variant_id?: string | null
}

type VariantSource = {
  id?: string
  name: string
  sku: string
  price: number
  stock_count: number
  compare_at_price?: number | null
  weight_kg?: number | null
  box_height_cm?: number | null
  box_width_cm?: number | null
  box_breadth_cm?: number | null
}

// A variant row in the form. `key` is a stable client-side React key (rows can be removed from the middle) and is
// also how the "show on card" choice points at a variant that may not be saved yet; `id` is the database id of an
// existing variant ("" for a new one), so saving updates that variant in place instead of recreating it. The name
// is controlled so the publish check can name the variants that still need a photo; SKU, price and stock stay
// uncontrolled. `photo_url` is the variant's own photo ("" for none): every variant needs one to be published.
type PhotoState = { photo_url: string; uploading: boolean; error: string | null }
type VariantRow = PhotoState & VariantSource & { key: number; id: string; open: boolean }
let variantRowSeq = 0
const newVariantRow = (v?: VariantSource, photo_url = ""): VariantRow => ({
  key: ++variantRowSeq,
  id: v?.id ?? "",
  name: v?.name ?? "",
  sku: v?.sku ?? "",
  price: v?.price ?? 0,
  stock_count: v?.stock_count ?? 0,
  compare_at_price: v?.compare_at_price ?? null,
  weight_kg: v?.weight_kg ?? null,
  box_height_cm: v?.box_height_cm ?? null,
  box_width_cm: v?.box_width_cm ?? null,
  box_breadth_cm: v?.box_breadth_cm ?? null,
  // Sizes that already have their own "was" price, weight or box open with those fields showing.
  open: !!(v?.compare_at_price || v?.weight_kg || v?.box_height_cm),
  photo_url,
  uploading: false,
  error: null,
})

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
const PREFILL_CHECK_FIELDS = ["is_new_arrival", "is_pet_safe", "is_imported", "is_hard_leaf"] as const
const PREFILL_TAG_FIELDS = ["use_case_tags"] as const

type PrefillNote = { source: string; sku: string; filled: number; kept: string[] }

export function ProductForm({
  lookups,
  product,
  action,
}: {
  lookups: Lookups
  product?: ExistingProduct
  action: (formData: FormData) => Promise<ProductActionResult>
}) {
  // The first photo of each existing variant. A product with no variants yet is sold as one "Standard" variant
  // built from its own price and stock (created when it is saved); its photo is `standard`.
  const [variants, setVariants] = useState<VariantRow[]>(() => {
    const photoByVariant = new Map<string, string>()
    for (const image of product?.images ?? []) {
      if (image.variant_id && !photoByVariant.has(image.variant_id)) photoByVariant.set(image.variant_id, image.url)
    }
    return (product?.variants ?? []).map((v) => newVariantRow(v, (v.id && photoByVariant.get(v.id)) || ""))
  })
  const [standard, setStandard] = useState<PhotoState>(() => ({
    // A legacy product (no variants, photos from before) keeps its first photo as the Standard variant's.
    photo_url: product?.variants?.length ? "" : (product?.images?.[0]?.url ?? ""),
    uploading: false,
    error: null,
  }))
  // Which variant's photo the shop card shows. null = automatic (the cheapest variant that has a photo).
  const [cardKey, setCardKey] = useState<number | null>(() => variants.find((v) => v.id && v.id === product?.card_variant_id)?.key ?? null)
  const [wantsPublish, setWantsPublish] = useState(!!product?.published_at)
  const [categoryName, setCategoryName] = useState(product?.category_name ?? "")
  const [descriptionSeed, setDescriptionSeed] = useState({ key: 0, text: product?.description ?? "" })
  // Search listing, previewed live as Google would show it.
  const [seo, setSeo] = useState({ name: product?.name ?? "", title: product?.meta_title ?? "", description: product?.meta_description ?? "", summary: product?.short_description ?? "", slug: product?.slug ?? "" })
  // Tools & Equipment (Fertilizer, Other Equipment, Pots, Planting Media) have no plant care
  // info, size, box dimensions or tags -- and are delivered at 120 PKR per kg, so weight is mandatory.
  const isPlantCategory = !isNonPlantCategoryName(categoryName)
  const weightRequired = !isPlantCategory

  // Saving is driven from onSubmit (not <form action>) so a validation error from the server
  // can be shown without React 19 resetting every field the admin just typed.
  const [isSaving, startSaving] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

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
      if (name === "description") {
        // The description lives in the rich editor: re-seed it rather than writing to its hidden input.
        setDescriptionSeed((seed) => ({ key: seed.key + 1, text: src.description ?? "" }))
        filled++
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
    // A new product gets a slug from its name, unless one was typed.
    const slugInput = formRef.current?.elements.namedItem("slug")
    if (slugInput instanceof HTMLInputElement && !slugInput.value.trim() && raw.trim()) {
      slugInput.value = slugify(raw).slice(0, 100)
      setSeo((s) => ({ ...s, slug: slugInput.value }))
    }
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

  const namedVariants = variants.filter((v) => v.name.trim())
  const hasVariants = namedVariants.length > 0
  const uploadingCount = variants.filter((v) => v.uploading).length + (standard.uploading ? 1 : 0)

  // The card shows the ticked variant, or (nothing ticked) the cheapest one that has a photo.
  const cheapestWithPhotoKey = [...namedVariants]
    .filter((v) => v.photo_url)
    .sort((a, b) => a.price - b.price)[0]?.key
  const effectiveCardKey = namedVariants.some((v) => v.key === cardKey) ? cardKey : (cheapestWithPhotoKey ?? namedVariants[0]?.key ?? null)

  // Why Published can't be ticked yet (the server enforces the same rule).
  const publishProblem = publishBlocker(
    hasVariants ? namedVariants.map((v) => ({ name: v.name, hasPhoto: !!v.photo_url })) : [{ name: "Standard", hasPhoto: !!standard.photo_url }]
  )

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (uploadingCount > 0 || isSaving) return
    const formData = new FormData(e.currentTarget)
    setSaveError(null)
    startSaving(async () => {
      try {
        const result = await action(formData)
        if (result?.error) {
          setSaveError(result.error)
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      } catch {
        setSaveError("Something went wrong while saving. Check your connection and try again.")
      }
    })
  }

  function updateVariant(key: number, patch: Partial<PhotoState> & Partial<VariantRow>) {
    setVariants((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  // Uploads one photo (downscaled, converted to AVIF, stored in R2) into a variant row or the Standard slot. On
  // failure the row keeps its previous photo and shows the error, so nothing is lost silently.
  async function uploadPhoto(target: number | "standard", file: File) {
    const patch = (p: Partial<PhotoState>) => (target === "standard" ? setStandard((s) => ({ ...s, ...p })) : updateVariant(target, p))
    patch({ uploading: true, error: null })
    try {
      patch({ photo_url: await uploadAdminImage(file, "products"), uploading: false })
    } catch (err) {
      patch({ uploading: false, error: err instanceof Error ? err.message : "Upload failed." })
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onChange={(e) => {
        const { name } = e.target as unknown as { name?: string }
        if (name) touched.current.add(name)
        if (name === "published") setWantsPublish((e.target as unknown as HTMLInputElement).checked)
      }}
      className="max-w-5xl"
    >
      {saveError && <Alert tone="danger" className="mb-6">{saveError}</Alert>}

      <div>
        <FormSection title="Basics" description="What the product is called and how it's identified.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" required>
              <input name="name" defaultValue={product?.name} required onBlur={handleNameBlur} onChange={(e) => setSeo((s) => ({ ...s, name: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="SKU" required>
              <input name="sku" defaultValue={product?.sku} required className={cn(inputClass, "font-mono")} />
            </Field>
            <Field label="Slug" required>
              <input name="slug" defaultValue={product?.slug} required onChange={(e) => setSeo((s) => ({ ...s, slug: e.target.value }))} className={cn(inputClass, "font-mono")} />
            </Field>
            <Field label="Category" required>
              <select
                name="category_name"
                defaultValue={product?.category_name ?? ""}
                required
                className={inputClass}
                onChange={(e) => {
                  setCategoryName(e.target.value)
                  // New products: rare plants usually come in ones and twos, supplies by the dozen.
                  const threshold = formRef.current?.elements.namedItem("low_stock_threshold")
                  if (!product && threshold instanceof HTMLInputElement && !touched.current.has("low_stock_threshold")) {
                    threshold.value = isNonPlantCategoryName(e.target.value) ? "10" : "3"
                  }
                }}
              >
                <option value="">Select…</option>
                {lookups.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {lookupBusy && <p className="text-xs text-muted-foreground">Checking existing products…</p>}
          {lookupError && (
            <p role="alert" className="text-xs text-red-700">
              Couldn&apos;t check existing products: {lookupError}
            </p>
          )}
          {candidates && (
            <div className="space-y-2 rounded-md border border-clay-200 bg-clay-50 p-3 text-sm">
              <p className="font-medium">
                {candidates.length} existing products share this name. Copy details from one? (SKU, slug and image are never copied.)
              </p>
              <ul className="space-y-1">
                {candidates.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => applyPrefill(c)}
                      className="w-full rounded-md border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-primary"
                    >
                      <span className="font-mono text-[13px] font-medium">{c.sku}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {c.category_name ?? "no category"} · size {c.size ?? "?"} · PKR {c.price} · stock {c.stock_count ?? 0}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setCandidates(null)} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                None — start blank
              </button>
            </div>
          )}
          {prefillNote && (
            <div className="flex items-start justify-between gap-3 rounded-md border border-forest-200 bg-forest-50 p-3 text-sm">
              <p>
                Filled {prefillNote.filled} fields from existing product “{prefillNote.source}” ({prefillNote.sku}). All are editable.
                {prefillNote.kept.length > 0 && (
                  <> Kept what you had already edited: {prefillNote.kept.map((k) => k.replace(/_/g, " ")).join(", ")}.</>
                )}{" "}
                <strong>SKU and slug were not copied</strong> — both must be unique, so set new ones.
              </p>
              <button type="button" onClick={() => setPrefillNote(null)} className="shrink-0 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                Dismiss
              </button>
            </div>
          )}
          <Field
            label="One-line summary"
            hint={<CharCount value={seo.summary} ideal={120} max={300}>Shown under the name on the product page.</CharCount>}
          >
            <input
              name="short_description"
              defaultValue={product?.short_description ?? ""}
              onChange={(e) => setSeo((s) => ({ ...s, summary: e.target.value }))}
              placeholder="e.g. A fast-growing climber with deeply split leaves, easy in bright shade."
              className={inputClass}
            />
          </Field>
          <div>
            <p className="mb-1.5 block text-[13px] font-medium text-foreground">
              Full description<span aria-hidden className="ml-0.5 text-primary">*</span>
            </p>
            <RichEditor
              key={descriptionSeed.key}
              name="description"
              initialMarkdown={descriptionSeed.text}
              allowImages={false}
              label="Full description"
              placeholder="What the plant is, its size and pot, how it grows, what arrives in the box. Aim for 200-300 words."
            />
          </div>
        </FormSection>

        <FormSection
          title="Pricing & stock"
          description={
            hasVariants
              ? "Price and stock come from the variants below: the shop shows “Starting from” the lowest price, and stock is their total. Stock status (In stock / Low stock / Out of stock) is worked out automatically."
              : "Stock status (In stock / Low stock / Out of stock) is worked out automatically. Without variants, this product is sold as a single “Standard” option with this price and stock."
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {!hasVariants && (
              <Field label="Price (PKR)" required>
                <input type="number" name="price" defaultValue={product?.price} required className={inputClass} />
              </Field>
            )}
            {!hasVariants && (
              <Field label="Was price" hint="Shown struck through when higher than the price.">
                <input type="number" name="compare_at_price" defaultValue={product?.compare_at_price ?? ""} className={inputClass} />
              </Field>
            )}
            {!hasVariants && (
              <Field label="Stock count" required>
                <input type="number" name="stock_count" defaultValue={product?.stock_count ?? 0} required className={inputClass} />
              </Field>
            )}
            <Field label="Low-stock level" required hint="“Only N left” shows at or below this.">
              <input
                type="number"
                name="low_stock_threshold"
                defaultValue={product?.low_stock_threshold ?? 3}
                min={0}
                required
                className={inputClass}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Box dimensions only apply to plants; hidden (not unmounted) for Tools & Equipment so values survive a category switch. */}
            <div className={isPlantCategory ? "contents" : "hidden"}>
              <Field label="Box height (cm)">
                <input type="number" name="box_height_cm" defaultValue={product?.box_height_cm ?? ""} className={inputClass} />
              </Field>
              <Field label="Box width (cm)">
                <input type="number" name="box_width_cm" defaultValue={product?.box_width_cm ?? ""} className={inputClass} />
              </Field>
              <Field label="Box breadth (cm)">
                <input type="number" name="box_breadth_cm" defaultValue={product?.box_breadth_cm ?? ""} className={inputClass} />
              </Field>
            </div>
            <Field label="Weight (kg)" required={weightRequired}>
              <input
                type="number"
                name="weight_kg"
                defaultValue={product?.weight_kg ?? ""}
                step="0.01"
                min={weightRequired ? "0.01" : "0"}
                required={weightRequired}
                className={weightRequired ? highlightInputClass : inputClass}
              />
            </Field>
          </div>
          {weightRequired && (
            <p className="text-xs text-muted-foreground">
              Weight is required for {categoryName}: delivery for these products is charged at 120 PKR per kg (weight × quantity).
            </p>
          )}
        </FormSection>

        <FormSection
          title={isPlantCategory ? "Plant attributes" : "Attributes"}
          description={
            isPlantCategory
              ? "Care level, size and how the product is listed."
              : `Care requirements, size, box dimensions and use-case tags don't apply to ${categoryName}, so they're hidden here and won't appear on the website.`
          }
        >
          {/* Hidden (not unmounted) for Tools & Equipment so values survive a category switch; the server clears them on save. */}
          <div className={isPlantCategory ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4" : "hidden"}>
            <Field label="Difficulty">
              <select name="difficulty" defaultValue={product?.difficulty ?? "beginner"} className={inputClass}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </Field>
            <Field label="Light requirement" required>
              <select name="light_requirement" defaultValue={product?.light_requirement ?? "medium"} required className={inputClass}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="bright">Bright</option>
                <option value="full_sun">Full sun</option>
              </select>
            </Field>
            <Field label="Water requirement">
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
          <div className="grid gap-4 sm:grid-cols-2">
            <CheckField
              name="is_new_arrival"
              label="New arrival"
              description="The “New” tag is removed automatically 14 days after publishing."
              defaultChecked={product?.is_new_arrival}
            />
            <div className={isPlantCategory ? "contents" : "hidden"}>
              <CheckField name="is_pet_safe" label="Pet safe" defaultChecked={product?.is_pet_safe} />
              <CheckField
                name="is_imported"
                label="Imported"
                description="Shows an “Imported” tag on the plant's page."
                defaultChecked={product?.is_imported}
              />
            </div>
            {isMangaveCategory(categoryName) && (
              <CheckField
                name="is_hard_leaf"
                label="Hard leaf (ships bare-root)"
                description="Stiff, easily-broken leaves. Ships bare-root with the pot sent separately, instead of potted. Leave unticked for soft-leaf Mangaves."
                defaultChecked={product?.is_hard_leaf}
              />
            )}
            <CheckField
              name="is_featured"
              label="Featured"
              description="Shown first on the homepage and at the top of the shop's Recommended order."
              defaultChecked={product?.is_featured}
            />
            <CheckField name="published" label="Published" description="Untick to keep it as a draft." defaultChecked={!!product?.published_at} />
          </div>
          <Field label="Shop order" hint="Optional. Lower numbers come first in the Recommended order (after featured products). Leave empty for newest first." className="sm:max-w-xs">
            <input type="number" name="sort_position" min={0} max={100000} defaultValue={product?.sort_position ?? ""} className={inputClass} />
          </Field>
          {wantsPublish && publishProblem && (
            <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Can&apos;t publish yet: {publishProblem} Untick Published to save it as a draft.
            </p>
          )}
        </FormSection>

        <FormSection title="Use case tags" description="Used for filtering in the shop." className={isPlantCategory ? undefined : "hidden"}>
          <TagGroup legend="Use case" name="use_case_tags" tags={lookups.useCaseTags} selected={product?.use_case_tags} />
        </FormSection>

        <FormSection title="Care info" description="Shown on the product page." className={isPlantCategory ? undefined : "hidden"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Light summary (short)">
              <input name="light_summary" defaultValue={product?.light_summary ?? ""} className={inputClass} />
            </Field>
            <Field label="Water summary (short)">
              <input name="water_summary" defaultValue={product?.water_summary ?? ""} className={inputClass} />
            </Field>
          </div>
          <Field label="Light (detail)">
            <textarea name="light" defaultValue={product?.light ?? ""} rows={2} className={textareaClass} />
          </Field>
          <Field label="Water (detail)">
            <textarea name="water" defaultValue={product?.water ?? ""} rows={2} className={textareaClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Humidity">
              <textarea name="humidity" defaultValue={product?.humidity ?? ""} rows={2} className={textareaClass} />
            </Field>
            <Field label="Temperature">
              <textarea name="temperature" defaultValue={product?.temperature ?? ""} rows={2} className={textareaClass} />
            </Field>
            <Field label="Soil">
              <textarea name="soil" defaultValue={product?.soil ?? ""} rows={2} className={textareaClass} />
            </Field>
            <Field label="Fertilizer">
              <textarea name="fertilizer" defaultValue={product?.fertilizer ?? ""} rows={2} className={textareaClass} />
            </Field>
          </div>
          <Field label="Toxicity">
            <textarea name="toxicity" defaultValue={product?.toxicity ?? ""} rows={2} className={textareaClass} />
          </Field>
          <Field label="Pet safe note">
            <input name="pet_safe_note" defaultValue={product?.pet_safe_note ?? ""} className={inputClass} />
          </Field>
        </FormSection>

        <FormSection title="Search listing" description="How the product appears on Google and when its link is shared. Leave empty to use the name and summary.">
          <Field label="SEO title" hint={<CharCount value={seo.title} ideal={60} max={70}>e.g. “Monstera Deliciosa Price in Pakistan”.</CharCount>}>
            <input name="meta_title" defaultValue={product?.meta_title ?? ""} onChange={(e) => setSeo((s) => ({ ...s, title: e.target.value }))} className={inputClass} />
          </Field>
          <Field label="SEO description" hint={<CharCount value={seo.description} ideal={155} max={170}>Plant, size, a price hint and delivery.</CharCount>}>
            <textarea name="meta_description" rows={2} defaultValue={product?.meta_description ?? ""} onChange={(e) => setSeo((s) => ({ ...s, description: e.target.value }))} className={textareaClass} />
          </Field>
          <SearchPreview
            title={seo.title || (seo.name ? `${seo.name} Price in Pakistan` : "")}
            slug={seo.slug}
            description={seo.description || seo.summary}
          />
        </FormSection>

        <FormSection
          title="Variants and photos"
          description="Every product needs at least one variant, and every variant needs its own photo, showing the exact plant or item you will ship (not a reference image). The variant ticked under Card is the photo shown on the shop grid, with the lowest variant price. Photos are converted to AVIF and stored in Cloudflare R2; replaced ones are deleted when you save."
        >
          {variants.length === 0 ? (
            <div className="flex items-center gap-3 rounded-md border border-border p-3">
              <input type="hidden" name="standard_photo" value={standard.photo_url} />
              <VariantPhoto
                url={standard.photo_url}
                uploading={standard.uploading}
                error={standard.error}
                onPick={(file) => void uploadPhoto("standard", file)}
                onClear={() => setStandard((s) => ({ ...s, photo_url: "", error: null }))}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">Photo</p>
                <p className="text-xs text-muted-foreground">
                  No variants: this product is sold as one option using the price and stock above. Add variants below for different sizes or pot types.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`hidden gap-2 px-0.5 text-xs font-medium text-muted-foreground sm:grid ${VARIANT_COLUMNS}`} aria-hidden>
                <span>Photo</span>
                <span>Card</span>
                <span>Name</span>
                <span>SKU</span>
                <span>Price</span>
                <span>Stock</span>
                <span />
              </div>
              {variants.map((v) => (
                <div key={v.key} className={`grid items-center gap-2 ${VARIANT_COLUMNS}`}>
                  <input type="hidden" name="variant_id" value={v.id} />
                  {/* The key lets the card choice point at this variant even before it has a database id. */}
                  <input type="hidden" name="variant_key" value={v.key} />
                  {/* Always submitted, even empty, so the photo list stays in step with the other variant fields. */}
                  <input type="hidden" name="variant_photo" value={v.photo_url} />
                  <VariantPhoto
                    url={v.photo_url}
                    uploading={v.uploading}
                    error={v.error}
                    onPick={(file) => void uploadPhoto(v.key, file)}
                    onClear={() => updateVariant(v.key, { photo_url: "", error: null })}
                  />
                  <label className="flex items-center gap-2 text-[13px] sm:justify-center">
                    <input
                      type="radio"
                      name="card_variant_choice"
                      checked={effectiveCardKey === v.key}
                      onChange={() => setCardKey(v.key)}
                      aria-label={`Show ${v.name.trim() || "this variant"} on the shop card`}
                      className="h-4 w-4 accent-forest-700"
                    />
                    <span className="sm:sr-only">Show on card</span>
                  </label>
                  <input name="variant_name" aria-label="Variant name" value={v.name} onChange={(e) => updateVariant(v.key, { name: e.target.value })} placeholder='e.g. Medium - 8" pot' className={inputClass} />
                  <input name="variant_sku" aria-label="Variant SKU" defaultValue={v.sku} placeholder="Auto" title="Leave empty to use the product SKU plus the size" className={cn(inputClass, "font-mono")} />
                  <input type="number" name="variant_price" aria-label="Variant price" defaultValue={v.price} placeholder="Price" className={inputClass} onChange={(e) => updateVariant(v.key, { price: Number(e.target.value) })} />
                  <input type="number" name="variant_stock" aria-label="Variant stock" defaultValue={v.stock_count} placeholder="Stock" className={inputClass} />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateVariant(v.key, { open: !v.open })}
                      aria-expanded={v.open}
                      aria-label={`More details for ${v.name.trim() || "this variant"}`}
                      title="Was price, weight and box size"
                      className={buttonClass({ variant: "ghost", size: "sm" })}
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform", v.open && "rotate-180")} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setVariants(variants.filter((row) => row.key !== v.key))}
                      className={buttonClass({ variant: "ghost", size: "sm", className: "text-red-700 hover:bg-red-50 hover:text-red-800" })}
                    >
                      Remove
                    </button>
                  </div>
                  {/* Per-size extras. Always in the form (hidden when collapsed) so every size submits the same fields. */}
                  <div className={cn("grid gap-2 rounded-md bg-muted/40 p-3 sm:col-span-full sm:grid-cols-5", !v.open && "hidden")}>
                    <Field label="Was price">
                      <input type="number" name="variant_compare_at" defaultValue={v.compare_at_price ?? ""} min={0} className={inputClass} />
                    </Field>
                    <Field label="Weight (kg)">
                      <input type="number" name="variant_weight" defaultValue={v.weight_kg ?? ""} min={0} step="0.01" className={inputClass} />
                    </Field>
                    <Field label="Box H (cm)">
                      <input type="number" name="variant_box_h" defaultValue={v.box_height_cm ?? ""} min={0} className={inputClass} />
                    </Field>
                    <Field label="Box W (cm)">
                      <input type="number" name="variant_box_w" defaultValue={v.box_width_cm ?? ""} min={0} className={inputClass} />
                    </Field>
                    <Field label="Box B (cm)">
                      <input type="number" name="variant_box_b" defaultValue={v.box_breadth_cm ?? ""} min={0} className={inputClass} />
                    </Field>
                    <p className="text-xs text-muted-foreground sm:col-span-full">
                      Leave empty to use the product&apos;s weight and box. A bigger pot ships heavier, so give large sizes their own.
                    </p>
                  </div>
                </div>
              ))}
              {/* Only an explicit choice is saved; nothing ticked by hand means the shop picks the cheapest variant with a photo. */}
              <input type="hidden" name="card_variant" value={cardKey !== null && namedVariants.some((v) => v.key === cardKey) ? cardKey : ""} />
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              // Adding the first variant carries over the photo already chosen for the single "Standard" option.
              setVariants([...variants, newVariantRow(undefined, variants.length === 0 ? standard.photo_url : "")])
              if (variants.length === 0) setStandard({ photo_url: "", uploading: false, error: null })
            }}
            className={buttonClass({ variant: "secondary", size: "sm" })}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add variant
          </button>
        </FormSection>
      </div>

      <FormActions className="justify-end">
        <Link href="/admin/products" className={buttonClass({ variant: "ghost", size: "lg" })}>
          Cancel
        </Link>
        <button type="submit" disabled={uploadingCount > 0 || isSaving} className={buttonClass({ variant: "primary", size: "lg" })}>
          {(uploadingCount > 0 || isSaving) && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {uploadingCount > 0
            ? `Uploading ${uploadingCount} image${uploadingCount > 1 ? "s" : ""}…`
            : isSaving
              ? "Saving…"
              : product
                ? "Save changes"
                : "Create product"}
        </button>
      </FormActions>
    </form>
  )
}

// Photo | card | name | SKU | price | stock | remove: shared by the header row and every variant row so the columns line up.
const VARIANT_COLUMNS = "sm:grid-cols-[4rem_2.75rem_minmax(0,1.6fr)_minmax(0,1fr)_7rem_6rem_4.5rem]"

// Tag checkboxes drawn as toggle chips. The real checkbox stays in the DOM (visually hidden) so the form and the
// name-prefill code keep working exactly as before.
function TagGroup({ legend, name, tags, selected }: { legend: string; name: string; tags: string[]; selected?: string[] }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <label key={tag} className="cursor-pointer">
            <input type="checkbox" name={name} value={tag} defaultChecked={selected?.includes(tag)} className="peer sr-only" />
            <span className="inline-flex items-center rounded-full border border-input bg-surface px-3 py-1 text-[13px] transition-colors hover:bg-muted peer-checked:border-forest-700 peer-checked:bg-forest-700 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
              {tag}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

// The variant's own photo: a square that opens the file picker (camera or gallery on a phone). Picking a file
// replaces the photo; Clear removes it. The file itself is never part of the form submit (no name attribute): the
// upload returns a URL, which the caller keeps in a hidden input.
function VariantPhoto({
  url,
  uploading,
  error,
  onPick,
  onClear,
}: {
  url: string
  uploading: boolean
  error: string | null
  onPick: (file: File) => void
  onClear: () => void
}) {
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null)
  const showPreview = /^https?:\/\//i.test(url) && brokenUrl !== url

  return (
    <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-1">
      <label
        className={cn(
          "relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-input bg-muted text-muted-foreground transition-colors hover:border-primary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          uploading ? "cursor-wait" : "cursor-pointer",
          url && "border-solid"
        )}
      >
        {showPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Variant photo" onError={() => setBrokenUrl(url)} className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-5 w-5" aria-hidden />
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-surface/70">
            <Loader2 className="h-4 w-4 animate-spin text-foreground/70" aria-label="Uploading" />
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          aria-label={url ? "Replace photo" : "Add photo"}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = "" // allow re-selecting the same file
            if (file) onPick(file)
          }}
          className="sr-only"
        />
      </label>
      {url && !uploading && (
        <button type="button" onClick={onClear} className="text-xs text-red-700 underline underline-offset-2 hover:text-red-800">
          Clear
        </button>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

/** Character count for a field, green in the ideal range, amber when close to the limit. */
function CharCount({ value, ideal, max, children }: { value: string; ideal: number; max: number; children?: React.ReactNode }) {
  const n = value.trim().length
  return (
    <span className="flex flex-wrap justify-between gap-2">
      <span>{children}</span>
      <span className={cn("tabular-nums", n === 0 ? "" : n <= ideal ? "text-forest-700" : n <= max ? "text-amber-700" : "text-red-700")}>
        {n}/{ideal}
      </span>
    </span>
  )
}

/** Roughly how the product shows in Google results (title cut at ~60 characters, description at ~155). */
function SearchPreview({ title, slug, description }: { title: string; slug: string; description: string }) {
  const cut = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text)
  return (
    <div className="rounded-md border border-border bg-background p-4" aria-label="Search result preview">
      <p className="text-xs text-muted-foreground">Preview</p>
      <p className="mt-2 truncate text-xs text-[#4d5156]">muffinplants.com › shop › product › {slug || "your-product"}</p>
      <p className="mt-0.5 text-[17px] leading-snug text-[#1a0dab]">{cut(`${title || "Product name"} - Muffin Plants`, 62)}</p>
      <p className="mt-0.5 text-[13px] leading-5 text-[#4d5156]">{cut(description || "Add a summary or SEO description to control this text.", 158)}</p>
    </div>
  )
}
