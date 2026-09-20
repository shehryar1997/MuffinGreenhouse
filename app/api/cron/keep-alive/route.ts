import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { supabaseAdmin } from '@/supabase/admin-client'
import { safeEqual } from '@/lib/safe-compare'

export const dynamic = 'force-dynamic'

// Supabase pauses a Free plan project that gets too little database activity over 7 days. This
// route, scheduled daily by Vercel, reads a row from two tables so the project never looks idle.
// It is the backup heartbeat: .github/workflows/supabase-keepalive.yml is the other one and calls
// the REST API directly, so neither is a single point of failure.
const KEEP_ALIVE_TABLES = ['categories', 'products']

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret) {
    console.error('CRON_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  if (!(await safeEqual(request.headers.get('authorization'), 'Bearer ' + expectedSecret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Each read is independent: one failing must not skip the other, and every failure is reported.
  const failed: string[] = []
  for (const table of KEEP_ALIVE_TABLES) {
    const { error } = await supabaseAdmin.from(table).select('id').limit(1)
    if (error) {
      console.error('Keep-alive read failed for ' + table + ':', error)
      Sentry.captureException(new Error('Supabase keep-alive read failed for ' + table + ': ' + error.message))
      failed.push(table)
    }
  }

  if (failed.length > 0) {
    return NextResponse.json({ ok: false, failed }, { status: 500 })
  }
  return NextResponse.json({ ok: true, checked: KEEP_ALIVE_TABLES })
}
