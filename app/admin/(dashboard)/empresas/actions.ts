'use server'

import { revalidatePath } from 'next/cache'
import { addCompany, deleteCompany, updateCompany } from '@/lib/supabase/admin-queries'

export async function saveCompany(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim() || null
  const nameEn = String(formData.get('name_en') ?? '').trim() || null
  if (!name && !nameEn) return
  const url = String(formData.get('url') ?? '').trim() || null

  await addCompany(name, nameEn, url)
  revalidatePath('/admin/empresas')
}

export async function editCompany(id: string, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim() || null
  const nameEn = String(formData.get('name_en') ?? '').trim() || null
  if (!name && !nameEn) return
  const url = String(formData.get('url') ?? '').trim() || null

  await updateCompany(id, name, nameEn, url)
  revalidatePath('/admin/empresas')
}

export async function removeCompany(id: string) {
  await deleteCompany(id)
  revalidatePath('/admin/empresas')
}
