"use client"

import { useState } from "react"

const inputClass = "w-full border rounded px-3 py-2 text-sm"

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
  use_case_tags: string[]
  mood_tags: string[]
  images?: { url: string; alt_text: string }[]
  variants?: { name: string; sku: string; price: number; stock_count: number }[]
}

export function ProductForm({
  lookups,
  product,
  action,
}: {
  lookups: Lookups
  product?: ExistingProduct
  action: (formData: FormData) => void
}) {
  const [images, setImages] = useState(product?.images?.length ? product.images : [{ url: "", alt_text: "" }])
  const [variants, setVariants] = useState(product?.variants ?? [])

  return (
    <form action={action} className="space-y-8 bg-white rounded-lg border p-6">
      <section className="space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Basics</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Product Name">
            <input name="name" defaultValue={product?.name} required className={inputClass} />
          </Field>
          <Field label="SKU">
            <input name="sku" defaultValue={product?.sku} required className={inputClass} />
          </Field>
          <Field label="Slug">
            <input name="slug" defaultValue={product?.slug} required className={inputClass} />
          </Field>
          <Field label="Category">
            <select name="category_name" defaultValue={product?.category_name ?? ""} required className={inputClass}>
              <option value="">Select...</option>
              {lookups.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
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
        <div className="grid grid-cols-3 gap-4">
          <Field label="Box Height (cm)">
            <input type="number" name="box_height_cm" defaultValue={product?.box_height_cm ?? ""} className={inputClass} />
          </Field>
          <Field label="Box Width (cm)">
            <input type="number" name="box_width_cm" defaultValue={product?.box_width_cm ?? ""} className={inputClass} />
          </Field>
          <Field label="Box Breadth (cm)">
            <input type="number" name="box_breadth_cm" defaultValue={product?.box_breadth_cm ?? ""} className={inputClass} />
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
          Upload to your Cloudflare R2 bucket first, then paste the resulting URL here. First row is the primary photo.
        </p>
        {images.map((img, i) => (
          <div key={i} className="flex gap-3 items-start">
            <input name="image_url" defaultValue={img.url} placeholder="https://pub-....r2.dev/..." className={`${inputClass} flex-1`} />
            <input name="image_alt" defaultValue={img.alt_text} placeholder="Alt text" className={`${inputClass} flex-1`} />
            <button
              type="button"
              onClick={() => setImages(images.filter((_, idx) => idx !== i))}
              className="text-red-600 text-sm px-2 py-2 shrink-0"
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setImages([...images, { url: "", alt_text: "" }])} className="text-sm text-[#E85D2C]">
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
        <button type="submit" className="bg-[#E85D2C] text-white rounded px-6 py-3 font-medium">
          {product ? "Save changes" : "Create product"}
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
