'use server'

import { revalidatePath } from 'next/cache'
import {
  upsertArticle,
  deleteArticle,
  setArticleVisibility,
  upsertSiteContent,
} from '@/lib/supabase/admin-queries'
import { parseBilingualPt, parseBilingualEn } from '@/lib/bilingual'

export async function saveArticle(formData: FormData) {
  const id = formData.get('id')
  await upsertArticle({
    id: id ? String(id) : undefined,
    title: parseBilingualPt(formData, 'title'),
    title_en: parseBilingualEn(formData, 'title'),
    summary: parseBilingualPt(formData, 'summary'),
    summary_en: parseBilingualEn(formData, 'summary'),
    content_md: parseBilingualPt(formData, 'content_md'),
    content_md_en: parseBilingualEn(formData, 'content_md'),
    position: Number(formData.get('position') ?? 0),
    visible: formData.get('visible') === 'true',
  })
  revalidatePath('/admin/artigos')
}

export async function removeArticle(id: string) {
  await deleteArticle(id)
  revalidatePath('/admin/artigos')
}

export async function toggleArticleVisibility(id: string, visible: boolean) {
  await setArticleVisibility(id, visible)
  revalidatePath('/admin/artigos')
}

export async function toggleArtigosAtivo(ativo: boolean) {
  await upsertSiteContent('artigos_ativo', ativo ? 'true' : 'false')
  revalidatePath('/admin/artigos')
}
