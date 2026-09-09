'use server'

import { revalidatePath } from 'next/cache'
import {
  addContactLink,
  updateContactLink,
  deleteContactLink,
  setContactLinksOrder,
} from '@/lib/supabase/admin-queries'
import { parseBilingualPt, parseBilingualEn } from '@/lib/bilingual'

export async function saveContactLink(formData: FormData) {
  const label = String(formData.get('label') ?? '').trim()
  const url = String(formData.get('url') ?? '').trim()
  if (!label || !url) return

  await addContactLink(label, parseBilingualEn(formData, 'label'), url)
  revalidatePath('/admin/contato')
}

export async function editContactLink(id: string, formData: FormData) {
  const url = String(formData.get('url') ?? '').trim()
  if (!url) return

  await updateContactLink(id, parseBilingualPt(formData, 'label'), parseBilingualEn(formData, 'label'), url)
  revalidatePath('/admin/contato')
}

export async function removeContactLink(id: string) {
  await deleteContactLink(id)
  revalidatePath('/admin/contato')
}

export async function saveContactLinksOrder(orderedIds: string[]) {
  await setContactLinksOrder(orderedIds)
  revalidatePath('/admin/contato')
}
