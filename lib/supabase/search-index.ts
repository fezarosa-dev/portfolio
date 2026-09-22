import { createClient } from '@/lib/supabase/server'
import { embedTextSafe } from '@/lib/search/embed'
import type { Project, Article, Language } from '@/lib/supabase/queries'

function buildSearchText(...parts: (string | null | undefined)[]): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(' \n ')
}

type SearchIndexInput = {
  sourceTable: string
  sourceId: string
  title: string
  excerpt: string
  searchText: string
  url: string
}

export async function reindexSearchEntry(input: SearchIndexInput): Promise<void> {
  const embedding = await embedTextSafe(input.searchText)
  const supabase = await createClient()
  const { error } = await supabase.from('search_index').upsert(
    {
      source_table: input.sourceTable,
      source_id: input.sourceId,
      title: input.title,
      excerpt: input.excerpt,
      search_text: input.searchText,
      embedding,
      url: input.url,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'source_table,source_id' }
  )
  if (error) throw error
}

export async function removeSearchEntry(sourceTable: string, sourceId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('search_index')
    .delete()
    .eq('source_table', sourceTable)
    .eq('source_id', sourceId)
  if (error) throw error
}

export async function reindexProject(project: Project): Promise<void> {
  // simplificação: título/trecho exibidos sempre em português, mesmo buscando em /en —
  // o texto indexado inclui as duas variantes, então a busca funciona nos dois idiomas
  // mesmo que o rótulo mostrado não traduza. Evoluir se um dia fizer falta.
  const title = project.title ?? project.title_en ?? 'Projeto'
  const excerpt = project.summary ?? project.summary_en ?? ''
  const searchText = buildSearchText(
    project.title,
    project.title_en,
    project.summary,
    project.summary_en,
    project.content_md,
    project.content_md_en,
    project.company?.name,
    ...project.languages.map((lang) => lang.name),
    ...project.authors.map((author) => author.name)
  )
  const url = project.click_mode === 'link' && project.click_url ? project.click_url : `/projetos/${project.id}`

  await reindexSearchEntry({
    sourceTable: 'projects',
    sourceId: project.id,
    title,
    excerpt,
    searchText,
    url,
  })
}

export async function reindexArticle(article: Article): Promise<void> {
  const title = article.title ?? article.title_en ?? 'Artigo'
  const excerpt = article.summary ?? article.summary_en ?? ''
  const searchText = buildSearchText(
    article.title,
    article.title_en,
    article.summary,
    article.summary_en,
    article.content_md,
    article.content_md_en
  )

  await reindexSearchEntry({
    sourceTable: 'articles',
    sourceId: article.id,
    title,
    excerpt,
    searchText,
    url: `/artigos/${article.id}`,
  })
}

export async function reindexLanguage(language: Language): Promise<void> {
  await reindexSearchEntry({
    sourceTable: 'languages',
    sourceId: language.id,
    title: language.name,
    excerpt: '',
    searchText: language.name,
    url: `/projetos?tech=${language.id}`,
  })
}

export async function reindexSobreTexto(pt: string | null, en: string | null): Promise<void> {
  if (!pt && !en) {
    await removeSearchEntry('site_content', 'sobre_texto')
    return
  }
  await reindexSearchEntry({
    sourceTable: 'site_content',
    sourceId: 'sobre_texto',
    title: 'Sobre mim',
    excerpt: (pt ?? en ?? '').slice(0, 160),
    searchText: buildSearchText(pt, en),
    url: '/sobre',
  })
}

export async function reindexResume(contentMd: string | null, contentMdEn: string | null): Promise<void> {
  if (!contentMd && !contentMdEn) {
    await removeSearchEntry('resume', 'main')
    return
  }
  await reindexSearchEntry({
    sourceTable: 'resume',
    sourceId: 'main',
    title: 'Currículo',
    excerpt: (contentMd ?? contentMdEn ?? '').slice(0, 160),
    searchText: buildSearchText(contentMd, contentMdEn),
    url: '/curriculo',
  })
}
