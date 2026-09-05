import type { MetadataRoute } from 'next'
import { getVisibleProjects, getVisibleArticles, getSiteContent } from '@/lib/supabase/queries'

const SITE_URL = 'https://www.zanoni.dev.br'
const LOCALES = ['pt', 'en'] as const

function entriesFor(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`])
  )
  languages['x-default'] = `${SITE_URL}/pt${path}`
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    changeFrequency,
    priority,
    alternates: { languages },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, articles, content] = await Promise.all([
    getVisibleProjects(),
    getVisibleArticles(),
    getSiteContent(),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    ...entriesFor('', 'monthly', 1),
    ...entriesFor('/sobre', 'yearly', 0.6),
    ...entriesFor('/servicos', 'yearly', 0.6),
    ...entriesFor('/projetos', 'weekly', 0.9),
    ...entriesFor('/contato', 'yearly', 0.5),
    ...entriesFor('/curriculo', 'monthly', 0.6),
  ]

  if (content.artigos_ativo !== 'false') {
    staticRoutes.push(...entriesFor('/artigos', 'weekly', 0.8))
  }

  const projectRoutes: MetadataRoute.Sitemap = projects
    .filter((p) => p.click_mode === 'detail')
    .flatMap((p) => entriesFor(`/projetos/${p.id}`, 'monthly', 0.7))

  const articleRoutes: MetadataRoute.Sitemap =
    content.artigos_ativo !== 'false'
      ? articles.flatMap((a) => entriesFor(`/artigos/${a.id}`, 'monthly', 0.7))
      : []

  return [...staticRoutes, ...projectRoutes, ...articleRoutes]
}
