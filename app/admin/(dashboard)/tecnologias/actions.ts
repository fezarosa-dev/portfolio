'use server'

import { revalidatePath } from 'next/cache'
import {
  addLanguage,
  deleteLanguage,
  updateLanguage,
  setLanguagesOrder,
  setLanguageShowOnHome,
} from '@/lib/supabase/admin-queries'

export async function saveLanguage(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const iconUrl = String(formData.get('iconUrl') ?? '').trim()

  await addLanguage(name, iconUrl || undefined)
  revalidatePath('/admin/tecnologias')
}

export async function editLanguage(id: string, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const iconUrl = String(formData.get('iconUrl') ?? '').trim()

  await updateLanguage(id, name, iconUrl || undefined)
  revalidatePath('/admin/tecnologias')
}

export async function removeLanguage(id: string) {
  await deleteLanguage(id)
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
