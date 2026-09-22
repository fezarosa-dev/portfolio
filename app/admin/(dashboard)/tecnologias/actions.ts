'use server'

import { revalidatePath } from 'next/cache'
import {
  addLanguage,
  deleteLanguage,
  updateLanguage,
  setLanguagesOrder,
  setLanguageShowOnHome,
} from '@/lib/supabase/admin-queries'
import { reindexLanguage, removeSearchEntry } from '@/lib/supabase/search-index'

export async function saveLanguage(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const iconUrl = String(formData.get('iconUrl') ?? '').trim()

  const language = await addLanguage(name, iconUrl || undefined)
  await reindexLanguage(language)
  revalidatePath('/admin/tecnologias')
}

export async function editLanguage(id: string, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const iconUrl = String(formData.get('iconUrl') ?? '').trim()

  const language = await updateLanguage(id, name, iconUrl || undefined)
  await reindexLanguage(language)
  revalidatePath('/admin/tecnologias')
}

export async function removeLanguage(id: string) {
  await deleteLanguage(id)
  await removeSearchEntry('languages', id)
  revalidatePath('/admin/tecnologias')
}

export async function saveLanguagesOrder(orderedIds: string[]) {
  await setLanguagesOrder(orderedIds)
  revalidatePath('/admin/tecnologias')
}

export async function toggleShowOnHome(id: string, showOnHome: boolean) {
  await setLanguageShowOnHome(id, showOnHome)
  revalidatePath('/admin/tecnologias')
}
