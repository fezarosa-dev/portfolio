import { NextResponse } from 'next/server'
import { countRecentSearchesFromIp, logSearchRequest } from '@/lib/supabase/queries'
import { warmUpModel } from '@/lib/search/embed'

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MINUTES = 1

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  if (ip) {
    const recentCount = await countRecentSearchesFromIp(ip, RATE_LIMIT_WINDOW_MINUTES)
    if (recentCount >= RATE_LIMIT_MAX) {
      return NextResponse.json({ ok: false }, { status: 429 })
    }
    await logSearchRequest(ip)
  }
  await warmUpModel()
  return NextResponse.json({ ok: true })
}
