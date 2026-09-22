"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { ImageField } from "@/app/admin/_components/image-field"
import { Alert, CheckField, Field, FormActions, FormSection, buttonClass, inputClass, textareaClass } from "@/app/admin/_components/ui"
import { RichEditor } from "./rich-editor"
import { slugify } from "@/lib/event-format"
import type { JournalActionResult } from "./actions"

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
  author: "Muffin Plants",
  content: "",
  cover_image_url: null,
  tags: "",
  is_featured: false,
  meta_title: "",
  meta_description: "",
  published: false,
  published_at: "",
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
    <form onSubmit={onSubmit} noValidate className="max-w-5xl">
      {error && <Alert tone="danger" className="mb-6">{error}</Alert>}

      <div>
        <FormSection title="The article" description="What visitors read.">
          <Field label="Title" required>
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
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="Summary" required hint="One or two sentences. Shown on the journal page and under the title.">
            <textarea name="excerpt" required rows={2} maxLength={300} defaultValue={initial.excerpt} className={textareaClass} />
          </Field>
          <ImageField name="cover_image_url" folder="journal" label="Cover image" defaultUrl={initial.cover_image_url} hint="Landscape works best. Optional." />

          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-foreground">Article</span>
            <RichEditor name="content" initialMarkdown={initial.content} />
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              Use the buttons above the text, like in Word. Enter starts a new paragraph; Shift+Enter starts a new line inside the same paragraph.
              Select text and press Ctrl+K to add a link.
            </p>
          </div>
        </FormSection>

        <FormSection title="Details" description="Byline, tags and how the post shows up in search.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Author" required>
              <input name="author" required maxLength={80} defaultValue={initial.author} className={inputClass} />
            </Field>
            <Field label="Tags" hint="Comma separated, up to 6. e.g. care, propagation">
              <input name="tags" defaultValue={initial.tags} className={inputClass} />
            </Field>
            <Field label="Search title" hint="Optional. Defaults to the title.">
              <input name="meta_title" maxLength={70} defaultValue={initial.meta_title} className={inputClass} />
            </Field>
            <Field label="Search description" hint="Optional. Defaults to the summary.">
              <input name="meta_description" maxLength={170} defaultValue={initial.meta_description} className={inputClass} />
            </Field>
          </div>
          <CheckField name="is_featured" label="Feature this post" description="Shown at the top of the journal page." defaultChecked={initial.is_featured} />
        </FormSection>

        <FormSection title="Publishing" description="Drafts stay hidden. A future date schedules the post.">
          <CheckField
            name="publish"
            label="Publish this post"
            description="Untick to keep it as a draft."
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          {published && (
            <Field label="Publish date (Karachi time)" hint="Leave empty to publish now (or keep the original date). A future date schedules the post." className="max-w-sm">
              <input type="datetime-local" name="published_at" defaultValue={initial.published_at} className={inputClass} />
            </Field>
          )}
        </FormSection>
      </div>

      <FormActions className="justify-end">
        <Link href="/admin/journal" className={buttonClass({ variant: "ghost", size: "lg" })}>
          Cancel
        </Link>
        <button type="submit" disabled={isSaving} className={buttonClass({ variant: "primary", size: "lg" })}>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {isSaving ? "Saving…" : submitLabel}
        </button>
      </FormActions>
    </form>
  )
}
