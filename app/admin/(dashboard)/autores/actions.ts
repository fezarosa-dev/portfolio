'use server'

import { revalidatePath } from 'next/cache'
import { addAuthor, deleteAuthor, updateAuthor } from '@/lib/supabase/admin-queries'

export async function saveAuthor(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const url = String(formData.get('url') ?? '').trim() || null

  await addAuthor(name, url)
  revalidatePath('/admin/autores')
}

export async function editAuthor(id: string, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const url = String(formData.get('url') ?? '').trim() || null

  await updateAuthor(id, name, url)
  revalidatePath('/admin/autores')
}

export async function removeAuthor(id: string) {
  await deleteAuthor(id)
  revalidatePath('/admin/autores')
}
