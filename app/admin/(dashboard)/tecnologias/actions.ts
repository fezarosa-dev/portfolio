'use server'

import { revalidatePath } from 'next/cache'
import {
  addLanguage,
  deleteLanguage,
  updateLanguage,
  setLanguagesOrder,
  setLanguageShowOnHome,
  setLanguageCategory,
  addLanguageCategory,
  updateLanguageCategory,
  deleteLanguageCategory,
  moveLanguageCategory,
} from '@/lib/supabase/admin-queries'
import { reindexLanguage, removeSearchEntry } from '@/lib/supabase/search-index'

export async function saveLanguage(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const iconUrl = String(formData.get('iconUrl') ?? '').trim()

  const language = await addLanguage(name, iconUrl || undefined)
  if (formData.get('reindex') === 'true') await reindexLanguage(language)
  revalidatePath('/admin/tecnologias')
}

export async function editLanguage(id: string, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const iconUrl = String(formData.get('iconUrl') ?? '').trim()

  const language = await updateLanguage(id, name, iconUrl || undefined)
  await setLanguageCategory(id, String(formData.get('categoryId') ?? '') || null)
  if (formData.get('reindex') === 'true') await reindexLanguage(language)
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

export async function saveCategory(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  await addLanguageCategory(name, String(formData.get('nameEn') ?? ''))
  revalidatePath('/admin/tecnologias')
}

export async function editCategory(id: string, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  await updateLanguageCategory(id, name, String(formData.get('nameEn') ?? ''))
  revalidatePath('/admin/tecnologias')
}

export async function removeCategory(id: string) {
  await deleteLanguageCategory(id)
  revalidatePath('/admin/tecnologias')
}

export async function moveCategory(id: string, direction: -1 | 1) {
  await moveLanguageCategory(id, direction)
  revalidatePath('/admin/tecnologias')
}
