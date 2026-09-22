import { NextResponse } from 'next/server'
import { getLanguageUsageStats } from '@/lib/supabase/queries-cached'

export async function GET() {
  const stats = await getLanguageUsageStats()
  return NextResponse.json({ stats })
}
