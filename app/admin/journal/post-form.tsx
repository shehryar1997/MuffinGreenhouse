"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ImageField } from "@/app/admin/_components/image-field"
import { RichEditor } from "./rich-editor"
import { slugify } from "@/lib/event-format"
import type { JournalActionResult } from "./actions"

const inputClass = "w-full border rounded px-3 py-2 text-sm bg-white"

export interface PostFormValues {
  title: string
  slug: string
  excerpt: string
  author: string
  content: string
  cover_image_url: string | null
  tags: string
  is_featured: boolean
  meta_title: string
  meta_description: string
  published: boolean
  published_at: string // "YYYY-MM-DDTHH:mm" in Karachi time, or ""
}

const EMPTY: PostFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  author: "Muffin Greenhouse",
  content: "",
  cover_image_url: null,
  tags: "",
  is_featured: false,
  meta_title: "",
  meta_description: "",
  published: false,
  published_at: "",
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-neutral-500 mt-1">{hint}</span>}
    </label>
  )
}

export function PostForm({
  values,
  action,
  submitLabel,
}: {
  values?: PostFormValues
  action: (formData: FormData) => Promise<JournalActionResult>
  submitLabel: string
}) {
  const initial = values ?? EMPTY
  const [isSaving, startSaving] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState(initial.slug)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug))
  const [published, setPublished] = useState(initial.published)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isSaving) return
    const formData = new FormData(e.currentTarget)
    setError(null)
    startSaving(async () => {
      try {
        const result = await action(formData)
        if (result?.error) {
          setError(result.error)
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      } catch {
        setError("Something went wrong while saving. Check your connection and try again.")
      }
    })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 max-w-4xl">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-serif">The article</h2>
        <Field label="Title">
          <input
            name="title"
            required
            maxLength={140}
            defaultValue={initial.title}
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
            className={inputClass}
          />
        </Field>
        <Field label="Page address" hint={`muffinplants.com/journal/${slug || "…"}`}>
          <input
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(slugify(e.target.value))
            }}
            className={inputClass}
          />
        </Field>
        <Field label="Summary" hint="One or two sentences. Shown on the journal page and under the title.">
          <textarea name="excerpt" required rows={2} maxLength={300} defaultValue={initial.excerpt} className={inputClass} />
        </Field>
        <ImageField name="cover_image_url" folder="journal" label="Cover image" defaultUrl={initial.cover_image_url} hint="Landscape works best. Optional." />

        <div>
          <span className="block text-sm font-medium text-neutral-700 mb-1">Article</span>
          <RichEditor name="content" initialMarkdown={initial.content} />
          <p className="text-xs text-neutral-500 mt-1.5">
            Use the buttons above the text, like in Word. Enter starts a new paragraph; Shift+Enter starts a new line inside the same paragraph.
            Select text and press Ctrl+K to add a link.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-serif">Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Author">
            <input name="author" required maxLength={80} defaultValue={initial.author} className={inputClass} />
          </Field>
          <Field label="Tags" hint="Comma separated, up to 6. e.g. care, propagation">
            <input name="tags" defaultValue={initial.tags} className={inputClass} />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Search title" hint="Optional. Defaults to the title.">
            <input name="meta_title" maxLength={70} defaultValue={initial.meta_title} className={inputClass} />
          </Field>
          <Field label="Search description" hint="Optional. Defaults to the summary.">
            <input name="meta_description" maxLength={170} defaultValue={initial.meta_description} className={inputClass} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_featured" defaultChecked={initial.is_featured} />
          Feature this post at the top of the journal page
        </label>
      </section>

      <section className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-serif">Publishing</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="publish" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Publish this post (untick to keep it as a draft)
        </label>
        {published && (
          <Field label="Publish date (Karachi time)" hint="Leave empty to publish now (or keep the original date). A future date schedules the post.">
            <input type="datetime-local" name="published_at" defaultValue={initial.published_at} className={inputClass} />
          </Field>
        )}
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isSaving} className="bg-[#E85D2C] text-white rounded px-5 py-2.5 text-sm font-medium hover:bg-[#d45124] disabled:opacity-50">
          {isSaving ? "Saving…" : submitLabel}
        </button>
        <Link href="/admin/journal" className="text-sm text-neutral-600 hover:text-neutral-900">
          Cancel
        </Link>
      </div>
    </form>
  )
}
