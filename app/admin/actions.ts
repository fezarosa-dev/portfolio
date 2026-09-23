'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { upsertSiteContent } from '@/lib/supabase/admin-queries'

export async function republishSite() {
  updateTag('site')
  await upsertSiteContent('last_republish_at', new Date().toISOString())
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
