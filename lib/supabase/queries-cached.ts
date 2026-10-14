import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { createPublicClient } from './public-client'
import * as raw from './queries'
import { pickSource } from './pick-source'
import { getResumeSource, resumeContact } from './resume-queries'
import { getAllArticles, getAllProjects } from './admin-queries'
import { readDraft } from '@/lib/changes/draft'
import * as ov from '@/lib/changes/overlay'
import type { Change } from '@/lib/changes/types'
import type { ResumeSource } from '@/lib/resume'

export async function isPreview(): Promise<boolean> {
  return (await draftMode()).isEnabled
}

// --- preview com a fila de mudanças do admin aplicada por cima ---------------------------------
async function draft(): Promise<Change[]> {
  return (await isPreview()) ? readDraft() : []
}

/** Aplica a fila (se houver e o preview estiver ligado); qualquer falha cai de volta pro dado real. */
async function withDraft<T>(data: T, apply: (data: T, changes: Change[]) => T | Promise<T>): Promise<T> {
  const changes = await draft()
  if (changes.length === 0) return data
  try {
    return await apply(data, changes)
  } catch {
    return data
  }
}

async function projectContext(changes: Change[]) {
  const [languages, authors, companies] = await Promise.all([raw.getLanguages(), raw.getAuthors(), raw.getCompanies()])
  return {
    languages: ov.overlayLanguages(languages, changes),
    authors: ov.overlayAuthors(authors, changes),
    companies: ov.overlayCompanies(companies, changes),
  }
}

// no preview com fila, parte de TODOS os projetos/artigos (inclusive ocultos) pra poder mostrar os que a fila publica
async function allProjectsWithDraft(changes: Change[]) {
  return ov.overlayProjects(await getAllProjects(), changes, await projectContext(changes))
}

const SITE_TAG = 'site'
const opts = { tags: [SITE_TAG], revalidate: 60 }

const cachedSiteContent = unstable_cache(
  () => raw.getSiteContent(createPublicClient()),
  ['site-content'],
  opts
)
export async function getSiteContent() {
  const data = await pickSource(await isPreview(), () => raw.getSiteContent(createPublicClient()), cachedSiteContent)()
  return withDraft(data, ov.overlaySiteContent)
}

const cachedVisibleProjects = unstable_cache(
  () => raw.getVisibleProjects(createPublicClient()),
  ['visible-projects'],
  opts
)
export async function getVisibleProjects() {
  const data = await pickSource(await isPreview(), () => raw.getVisibleProjects(createPublicClient()), cachedVisibleProjects)()
  return withDraft(data, async (_d, changes) => (await allProjectsWithDraft(changes)).filter((p) => p.visible))
}

export async function getProjectById(id: string) {
  const cached = unstable_cache(
    () => raw.getProjectById(id, createPublicClient()),
    ['project-by-id', id],
    opts
  )
  const data = await pickSource(await isPreview(), () => raw.getProjectById(id, createPublicClient()), cached)()
  return withDraft(data, async (_d, changes) => {
    const found = (await allProjectsWithDraft(changes)).find((p) => (raw.UUID_RE.test(id) ? p.id === id : p.slug === id))
    return found && found.visible ? found : null
  })
}

const cachedLanguages = unstable_cache(
  () => raw.getLanguages(createPublicClient()),
  ['languages'],
  opts
)
export async function getLanguages() {
  const data = await pickSource(await isPreview(), () => raw.getLanguages(createPublicClient()), cachedLanguages)()
  return withDraft(data, ov.overlayLanguages)
}

const cachedLanguageCategories = unstable_cache(
  () => raw.getLanguageCategories(createPublicClient()),
  ['language-categories'],
  opts
)
export async function getLanguageCategories() {
  const data = await pickSource(
    await isPreview(),
    () => raw.getLanguageCategories(createPublicClient()),
    cachedLanguageCategories
  )()
  return withDraft(data, ov.overlayCategories)
}

const cachedVisibleArticles = unstable_cache(
  () => raw.getVisibleArticles(createPublicClient()),
  ['visible-articles'],
  opts
)
export async function getLanguageUsageStats({ includeUnused = false } = {}) {
  const [projects, languages] = await Promise.all([getVisibleProjects(), getLanguages()])
  const total = projects.length
  const projectsByLanguage = new Map<string, { id: string; title: string | null; title_en: string | null }[]>()
  for (const project of projects) {
    for (const language of project.languages) {
      const list = projectsByLanguage.get(language.id) ?? []
      list.push({ id: project.id, title: project.title, title_en: project.title_en })
      projectsByLanguage.set(language.id, list)
    }
  }
  return languages
    .map((language) => {
      const languageProjects = projectsByLanguage.get(language.id) ?? []
      return {
        ...language,
        percentage: total > 0 ? Math.round((languageProjects.length / total) * 100) : 0,
        projects: languageProjects,
      }
    })
    .filter((stat) => includeUnused || stat.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage)
}

export async function getVisibleArticles() {
  const data = await pickSource(await isPreview(), () => raw.getVisibleArticles(createPublicClient()), cachedVisibleArticles)()
  return withDraft(data, async (_d, changes) => ov.overlayArticles(await getAllArticles(), changes).filter((a) => a.visible))
}

export async function getArticleById(id: string) {
  const cached = unstable_cache(
    () => raw.getArticleById(id, createPublicClient()),
    ['article-by-id', id],
    opts
  )
  const data = await pickSource(await isPreview(), () => raw.getArticleById(id, createPublicClient()), cached)()
  return withDraft(data, async (_d, changes) => {
    const found = ov.overlayArticles(await getAllArticles(), changes).find((a) => a.id === id)
    return found && found.visible ? found : null
  })
}

const cachedResume = unstable_cache(
  () => raw.getResume(createPublicClient()),
  ['resume'],
  opts
)
export async function getResume() {
  return pickSource(await isPreview(), () => raw.getResume(createPublicClient()), cachedResume)()
}

const cachedResumeLinks = unstable_cache(
  () => raw.getResumeLinks(createPublicClient()),
  ['resume-links'],
  opts
)
export async function getResumeLinks() {
  return pickSource(await isPreview(), () => raw.getResumeLinks(createPublicClient()), cachedResumeLinks)()
}

const cachedContactLinks = unstable_cache(
  () => raw.getContactLinks(createPublicClient()),
  ['contact-links'],
  opts
)
export async function getContactLinks() {
  const data = await pickSource(await isPreview(), () => raw.getContactLinks(createPublicClient()), cachedContactLinks)()
  return withDraft(data, ov.overlayContactLinks)
}

const cachedResumeSource = unstable_cache(
  () => getResumeSource(createPublicClient()),
  ['resume-source'],
  opts
)
/** Dados estruturados do currículo (página pública e PDF). */
export async function getResumeSourceCached() {
  const data = await pickSource(await isPreview(), () => getResumeSource(createPublicClient()), cachedResumeSource)()
  return withDraft<ResumeSource>(data, async (base, changes) => {
    const [content, languages, projects] = await Promise.all([raw.getSiteContent(), raw.getLanguages(), allProjectsWithDraft(changes)])
    const resume = ov.overlayResume(base, changes)
    const resumeProjects = ov.overlayResumeProjects(projects, changes).filter((p) => p.in_resume)
    return {
      ...resume,
      contact: resumeContact(ov.overlaySiteContent(content, changes)),
      companies: ov.overlayCompanies(base.companies as never, changes).map((c) => ({ id: c.id, name: c.name, name_en: c.name_en })),
      technologies: Object.fromEntries(ov.overlayLanguages(languages, changes).map((l) => [l.id, { name: l.name, name_en: l.name_en }])),
      projects: resumeProjects.map((p) => ({
        id: p.id,
        title: p.title,
        title_en: p.title_en,
        resume_what: p.resume_what,
        resume_what_en: p.resume_what_en,
        resume_with: p.resume_with,
        resume_with_en: p.resume_with_en,
        resume_solves: p.resume_solves,
        resume_solves_en: p.resume_solves_en,
        resume_position: p.resume_position,
        project_languages: p.languages.map((l) => ({ language_id: l.id })),
      })),
    }
  })
}
