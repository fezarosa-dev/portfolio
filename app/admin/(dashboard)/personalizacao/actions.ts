'use server'

import { revalidatePath } from 'next/cache'
import { upsertSiteContent, deleteSiteContentKey, getAllProjects, getAllArticles } from '@/lib/supabase/admin-queries'
import { getLanguages, getSiteContent, getResume } from '@/lib/supabase/queries'
import {
  reindexProject,
  reindexArticle,
  reindexLanguage,
  reindexSobreTexto,
  reindexResume,
  removeSearchEntry,
} from '@/lib/supabase/search-index'
import { parseBilingualPt, parseBilingualEn } from '@/lib/bilingual'

const KEYS = [
  'site_icon',
  'sobre_foto',
  'contato_email',
  'contato_telefone',
  'drive_folder_url',
  'status_color',
  'link_github',
  'link_linkedin',
] as const

const BILINGUAL_KEYS = [
  'hero_title',
  'hero_subtitle',
  'sobre_texto',
  'servicos_texto',
  'status_text',
  'como_usar_texto',
  'privacidade_texto',
  'termos_texto',
  'cookies_texto',
] as const

async function saveSide(key: string, value: string | null) {
  if (value === null) await deleteSiteContentKey(key)
  else await upsertSiteContent(key, value)
}

export async function toggleMascoteAtivo(ativo: boolean) {
  await upsertSiteContent('mascote_ativo', ativo ? 'true' : 'false')
  revalidatePath('/admin/personalizacao')
}

export async function saveSiteContent(formData: FormData) {
  await Promise.all([
    ...KEYS.map((key) => upsertSiteContent(key, String(formData.get(key) ?? ''))),
    ...BILINGUAL_KEYS.flatMap((key) => [
      saveSide(key, parseBilingualPt(formData, key)),
      saveSide(`${key}_en`, parseBilingualEn(formData, key)),
    ]),
  ])
  await reindexSobreTexto(parseBilingualPt(formData, 'sobre_texto'), parseBilingualEn(formData, 'sobre_texto'))
  revalidatePath('/admin/personalizacao')
}

export async function reindexAllSearchContent(): Promise<{
  projects: number
  articles: number
  languages: number
}> {
  const [projects, articles, languages, content, resume] = await Promise.all([
    getAllProjects(),
    getAllArticles(),
    getLanguages(),
    getSiteContent(),
    getResume(),
  ])

  const artigosAtivo = content.artigos_ativo !== 'false'

  await Promise.all([
    ...projects.filter((project) => project.visible).map((project) => reindexProject(project)),
    ...(artigosAtivo
      ? articles.filter((article) => article.visible).map((article) => reindexArticle(article))
      : articles.map((article) => removeSearchEntry('articles', article.id))),
    ...languages.map((language) => reindexLanguage(language)),
  ])
  await reindexSobreTexto(content.sobre_texto ?? null, content.sobre_texto_en ?? null)
  await reindexResume(resume.content_md, resume.content_md_en)

  revalidatePath('/admin/personalizacao')
  return { projects: projects.length, articles: articles.length, languages: languages.length }
}
