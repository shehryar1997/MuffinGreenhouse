import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import * as Sentry from '@sentry/nextjs'
import { supabaseAdmin } from '@/supabase/admin-client'
import { safeEqual } from '@/lib/safe-compare'
import { newArrivalCutoff, NEW_ARRIVAL_DAYS } from '@/lib/new-arrival'
import { deleteR2Keys, listUploadedObjects } from '@/lib/r2'
import { loadReferencedImageKeys } from '@/lib/product-images'

export const dynamic = 'force-dynamic'

// Files uploaded by the admin form but never saved onto a product (an abandoned form, or a
// photo replaced before saving) are only swept once they are at least this old, so a product
// someone is still filling in is never affected.
const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000
const MAX_ORPHAN_DELETES_PER_RUN = 200

async function clearExpiredNewArrivals() {
  const cutoff = newArrivalCutoff()

  // The window counts from published_at; products with no publish date fall back to created_at.
  const { data: byPublished, error: publishedError } = await supabaseAdmin
    .from('products')
    .update({ is_new_arrival: false })
    .eq('is_new_arrival', true)
    .not('published_at', 'is', null)
    .lt('published_at', cutoff)
    .select('id')
  if (publishedError) throw new Error('published_at pass failed: ' + publishedError.message)

  const { data: byCreated, error: createdError } = await supabaseAdmin
    .from('products')
    .update({ is_new_arrival: false })
    .eq('is_new_arrival', true)
    .is('published_at', null)
    .lt('created_at', cutoff)
    .select('id')
  if (createdError) throw new Error('created_at pass failed: ' + createdError.message)

  return (byPublished?.length ?? 0) + (byCreated?.length ?? 0)
}

async function sweepOrphanUploads() {
  const referenced = await loadReferencedImageKeys()
  if (!referenced) return { skipped: 'could not read image references', deleted: 0 }

  const objects = await listUploadedObjects()
  const cutoff = Date.now() - ORPHAN_MIN_AGE_MS
  const orphans = objects
    .filter((o) => o.lastModified.getTime() < cutoff && !referenced.has(o.key))
    .slice(0, MAX_ORPHAN_DELETES_PER_RUN)
    .map((o) => o.key)

  const deleted = await deleteR2Keys(orphans)
  return { skipped: null, deleted }
}

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret) {
    console.error('CRON_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  if (!(await safeEqual(request.headers.get('authorization'), 'Bearer ' + expectedSecret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result: Record<string, unknown> = {}

  // Each task is independent: one failing must not stop the other.
  try {
    const cleared = await clearExpiredNewArrivals()
    result.newArrivalsCleared = cleared
    if (cleared > 0) revalidatePath('/', 'layout')
  } catch (err) {
    console.error('New-arrival expiry failed:', err)
    Sentry.captureException(err)
    result.newArrivalsError = 'failed'
  }

  try {
    result.orphanUploads = await sweepOrphanUploads()
  } catch (err) {
    console.error('Orphan image sweep failed:', err)
    Sentry.captureException(err)
    result.orphanUploadsError = 'failed'
  }

  return NextResponse.json({ message: 'Daily maintenance completed (New tag window: ' + NEW_ARRIVAL_DAYS + ' days)', ...result })
}
