'use server'

import { revalidatePath } from 'next/cache'
import {
  upsertResume,
  addResumeLink,
  updateResumeLink,
  deleteResumeLink,
  setResumeLinksOrder,
} from '@/lib/supabase/admin-queries'
import { parseBilingualPt, parseBilingualEn } from '@/lib/bilingual'

export async function saveResume(formData: FormData) {
  await upsertResume(parseBilingualPt(formData, 'content_md'), parseBilingualEn(formData, 'content_md'))
  revalidatePath('/admin/curriculo')
}

export async function saveResumeLink(formData: FormData) {
  const label = String(formData.get('label') ?? '').trim()
  const url = String(formData.get('url') ?? '').trim()
  if (!label || !url) return

  await addResumeLink(label, parseBilingualEn(formData, 'label'), url)
  revalidatePath('/admin/curriculo')
}

export async function editResumeLink(id: string, formData: FormData) {
  const url = String(formData.get('url') ?? '').trim()
  if (!url) return

  await updateResumeLink(id, parseBilingualPt(formData, 'label'), parseBilingualEn(formData, 'label'), url)
  revalidatePath('/admin/curriculo')
}

export async function removeResumeLink(id: string) {
  await deleteResumeLink(id)
  revalidatePath('/admin/curriculo')
}

export async function saveResumeLinksOrder(orderedIds: string[]) {
  await setResumeLinksOrder(orderedIds)
  revalidatePath('/admin/curriculo')
}
