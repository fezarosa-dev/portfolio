'use server'

import { revalidatePath, updateTag } from 'next/cache'
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
  setLanguageCategoriesOrder,
} from '@/lib/supabase/admin-queries'
import { reindexLanguage, removeSearchEntry } from '@/lib/supabase/search-index'
import type { CategoryBatch } from '@/components/admin/category-list'
import type { TechnologyBatch } from '@/components/admin/technology-reorder-list'

export async function saveLanguage(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const iconUrl = String(formData.get('iconUrl') ?? '').trim()

  const language = await addLanguage(name, iconUrl || undefined, String(formData.get('name_en') ?? ''))
  if (formData.get('reindex') === 'true') await reindexLanguage(language)
  revalidatePath('/admin/tecnologias')
}

export async function removeLanguage(id: string) {
  await deleteLanguage(id)
  await removeSearchEntry('languages', id)
  revalidatePath('/admin/tecnologias')
}

export async function saveLanguagesBatch(batch: TechnologyBatch) {
  for (const item of batch.items) {
    if (item.text) {
      const language = await updateLanguage(item.id, item.text.name, item.text.iconUrl || undefined, item.text.nameEn)
      if (batch.reindex) await reindexLanguage(language)
    }
    if (item.categoryId !== undefined) await setLanguageCategory(item.id, item.categoryId)
    if (item.showOnHome !== undefined) await setLanguageShowOnHome(item.id, item.showOnHome)
  }
  if (batch.order) await setLanguagesOrder(batch.order)
  updateTag('site') // a home e /tecnologias usam o cache 'site'
  revalidatePath('/admin/tecnologias')
}

export async function saveCategory(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  await addLanguageCategory(name, String(formData.get('nameEn') ?? ''))
  revalidatePath('/admin/tecnologias')
}

export async function saveCategoriesBatch(batch: CategoryBatch) {
  await Promise.all(batch.items.map((item) => updateLanguageCategory(item.id, item.name, item.nameEn)))
  if (batch.order) await setLanguageCategoriesOrder(batch.order)
  updateTag('site') // /tecnologias usa o cache 'site'
  revalidatePath('/admin/tecnologias')
}

export async function removeCategory(id: string) {
  await deleteLanguageCategory(id)
  revalidatePath('/admin/tecnologias')
}
