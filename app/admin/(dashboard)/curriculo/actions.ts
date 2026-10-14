'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { importTechCategories } from '@/lib/supabase/resume-admin'

export async function importCategories() {
  await importTechCategories()
  revalidatePath('/admin/curriculo')
  updateTag('site') // currículo público e PDF usam o cache 'site'
}
