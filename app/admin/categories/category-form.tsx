"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Alert, Field, FormActions, FormSection, buttonClass, inputClass, textareaClass } from "../_components/ui"
import { RichEditor } from "../journal/rich-editor"
import type { CategoryActionResult } from "./actions"

type Category = {
  slug: string
  name: string
  tagline: string | null
  description: string | null
  intro: string | null
  meta_title: string | null
  meta_description: string | null
}

function Count({ value, ideal }: { value: string; ideal: number }) {
  const n = value.trim().length
  return <span className={`tabular-nums ${n === 0 ? "" : n <= ideal ? "text-forest-700" : "text-amber-700"}`}>{n}/{ideal}</span>
}

export function CategoryForm({ category, action }: { category: Category; action: (formData: FormData) => Promise<CategoryActionResult> }) {
  const [saving, startSaving] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(category.meta_title ?? "")
  const [description, setDescription] = useState(category.meta_description ?? "")

  return (
    <form
      className="max-w-5xl"
      onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        setError(null)
        startSaving(async () => {
          try {
            const result = await action(formData)
            if (result?.error) setError(result.error)
          } catch {
            setError("Something went wrong while saving. Check your connection and try again.")
          }
        })
      }}
    >
      {error && <Alert tone="danger" className="mb-6">{error}</Alert>}

      <FormSection title="On the category page" description="The heading area above the products.">
        <Field label="Tagline" hint="A short line above the name, e.g. “Bold leaves, stunning silhouettes.”">
          <input name="tagline" maxLength={120} defaultValue={category.tagline ?? ""} className={inputClass} />
        </Field>
        <Field label="Description" required hint="One or two sentences under the name.">
          <textarea name="description" maxLength={400} rows={2} required defaultValue={category.description ?? ""} className={textareaClass} />
        </Field>
      </FormSection>

      <FormSection
        title="Buying guide"
        description="Shown under the products on the first page. Explain what these plants are, how to choose one and how to care for them in Karachi. 150-300 words."
      >
        <RichEditor
          name="intro"
          initialMarkdown={category.intro ?? ""}
          allowImages={false}
          label={`${category.name} buying guide`}
          placeholder="What makes these plants special, how to pick one, light and watering in Karachi, common questions."
        />
      </FormSection>

      <FormSection title="Search listing" description="How the category shows on Google and when its link is shared.">
        <Field label="SEO title" hint={<span className="flex justify-between gap-2"><span>e.g. “Buy Hoya Plants Online in Pakistan”.</span><Count value={title} ideal={60} /></span>}>
          <input name="meta_title" maxLength={70} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="SEO description" hint={<span className="flex justify-end"><Count value={description} ideal={155} /></span>}>
          <textarea name="meta_description" maxLength={170} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={textareaClass} />
        </Field>
      </FormSection>

      <FormActions className="justify-end">
        <Link href="/admin/categories" className={buttonClass({ variant: "ghost", size: "lg" })}>Cancel</Link>
        <button type="submit" disabled={saving} className={buttonClass({ variant: "primary", size: "lg" })}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {saving ? "Saving…" : "Save category"}
        </button>
      </FormActions>
    </form>
  )
}
