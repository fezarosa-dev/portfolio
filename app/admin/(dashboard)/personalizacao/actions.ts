'use server'

import { revalidatePath } from 'next/cache'
import { getAllProjects, getAllArticles } from '@/lib/supabase/admin-queries'
import { getLanguages, getSiteContent, getResume } from '@/lib/supabase/queries'
import {
  reindexProject,
  reindexArticle,
  reindexLanguage,
  reindexSobreTexto,
  reindexResume,
} from '@/lib/supabase/search-index'

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

  await Promise.all([
    ...projects.filter((project) => project.visible).map((project) => reindexProject(project)),
    ...articles.filter((article) => article.visible).map((article) => reindexArticle(article)),
    ...languages.map((language) => reindexLanguage(language)),
  ])
  await reindexSobreTexto(content.sobre_texto ?? null, content.sobre_texto_en ?? null)
  await reindexResume(resume.content_md, resume.content_md_en)

  revalidatePath('/admin/personalizacao')
  return { projects: projects.length, articles: articles.length, languages: languages.length }
}
