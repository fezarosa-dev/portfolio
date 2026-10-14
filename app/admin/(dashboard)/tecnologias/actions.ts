'use server'

import { revalidatePath, updateTag } from 'next/cache'
import {
  addLanguageCategory,
  updateLanguageCategory,
  deleteLanguageCategory,
  setLanguageCategoriesOrder,
} from '@/lib/supabase/admin-queries'
import type { CategoryBatch } from '@/components/admin/category-list'

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
