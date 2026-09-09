'use server'

import { revalidatePath } from 'next/cache'
import {
  upsertProject,
  deleteProject,
  setProjectVisibility,
  setProjectLanguages,
  setProjectAuthors,
} from '@/lib/supabase/admin-queries'
import { parseBilingualPt, parseBilingualEn } from '@/lib/bilingual'

export async function saveProject(formData: FormData) {
  const id = formData.get('id')
  const project = await upsertProject({
    id: id ? String(id) : undefined,
    title: parseBilingualPt(formData, 'title'),
    title_en: parseBilingualEn(formData, 'title'),
    summary: parseBilingualPt(formData, 'summary'),
    summary_en: parseBilingualEn(formData, 'summary'),
    content_md: parseBilingualPt(formData, 'content_md'),
    content_md_en: parseBilingualEn(formData, 'content_md'),
    repo_url: String(formData.get('repo_url') ?? '') || null,
    site_url: String(formData.get('site_url') ?? '') || null,
    click_mode: formData.get('click_mode') === 'link' ? 'link' : 'detail',
    click_url: String(formData.get('click_url') ?? '') || null,
    company_id: String(formData.get('company_id') ?? '') || null,
    position: Number(formData.get('position') ?? 0),
    visible: formData.get('visible') === 'true',
    show_on_home: formData.get('show_on_home') === 'true',
  })
  await setProjectLanguages(project.id, formData.getAll('language_ids').map(String))
  await setProjectAuthors(project.id, formData.getAll('author_ids').map(String))
  revalidatePath('/admin/projetos')
}

export async function removeProject(id: string) {
  await deleteProject(id)
  revalidatePath('/admin/projetos')
}

export async function toggleVisibility(id: string, visible: boolean) {
  await setProjectVisibility(id, visible)
  revalidatePath('/admin/projetos')
}
