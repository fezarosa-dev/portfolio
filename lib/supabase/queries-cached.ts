import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { createPublicClient } from './public-client'
import * as raw from './queries'
import { pickSource } from './pick-source'

export { pickSource }

export async function isPreview(): Promise<boolean> {
  return (await draftMode()).isEnabled
}

const SITE_TAG = 'site'
const opts = { tags: [SITE_TAG], revalidate: 60 }

const cachedSiteContent = unstable_cache(
  () => raw.getSiteContent(createPublicClient()),
  ['site-content'],
  opts
)
export async function getSiteContent() {
  return pickSource(await isPreview(), () => raw.getSiteContent(createPublicClient()), cachedSiteContent)()
}

const cachedVisibleProjects = unstable_cache(
  () => raw.getVisibleProjects(createPublicClient()),
  ['visible-projects'],
  opts
)
export async function getVisibleProjects() {
  return pickSource(await isPreview(), () => raw.getVisibleProjects(createPublicClient()), cachedVisibleProjects)()
}

export async function getProjectById(id: string) {
  const cached = unstable_cache(
    () => raw.getProjectById(id, createPublicClient()),
    ['project-by-id', id],
    opts
  )
  return pickSource(await isPreview(), () => raw.getProjectById(id, createPublicClient()), cached)()
}

const cachedLanguages = unstable_cache(
  () => raw.getLanguages(createPublicClient()),
  ['languages'],
  opts
)
export async function getLanguages() {
  return pickSource(await isPreview(), () => raw.getLanguages(createPublicClient()), cachedLanguages)()
}

const cachedVisibleArticles = unstable_cache(
  () => raw.getVisibleArticles(createPublicClient()),
  ['visible-articles'],
  opts
)
export async function getVisibleArticles() {
  return pickSource(await isPreview(), () => raw.getVisibleArticles(createPublicClient()), cachedVisibleArticles)()
}

export async function getArticleById(id: string) {
  const cached = unstable_cache(
    () => raw.getArticleById(id, createPublicClient()),
    ['article-by-id', id],
    opts
  )
  return pickSource(await isPreview(), () => raw.getArticleById(id, createPublicClient()), cached)()
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
  return pickSource(await isPreview(), () => raw.getContactLinks(createPublicClient()), cachedContactLinks)()
}

const cachedAuthors = unstable_cache(
  () => raw.getAuthors(createPublicClient()),
  ['authors'],
  opts
)
export async function getAuthors() {
  return pickSource(await isPreview(), () => raw.getAuthors(createPublicClient()), cachedAuthors)()
}

const cachedCompanies = unstable_cache(
  () => raw.getCompanies(createPublicClient()),
  ['companies'],
  opts
)
export async function getCompanies() {
  return pickSource(await isPreview(), () => raw.getCompanies(createPublicClient()), cachedCompanies)()
}
