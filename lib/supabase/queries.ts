import { createClient } from '@/lib/supabase/server'

export type Language = {
  id: string
  name: string
  devicon_slug: string | null
  devicon_variant: string | null
  icon_source: string | null
  position: number
  show_on_home: boolean
}

export type Author = {
  id: string
  name: string
  url: string | null
}

export type Company = {
  id: string
  name: string | null
  name_en: string | null
  url: string | null
}

export type ResumeLink = {
  id: string
  label: string | null
  label_en: string | null
  url: string
  position: number
}

export type ContactLink = {
  id: string
  label: string | null
  label_en: string | null
  url: string
  position: number
}

export type Article = {
  id: string
  title: string | null
  title_en: string | null
  summary: string | null
  summary_en: string | null
  content_md: string | null
  content_md_en: string | null
  visible: boolean
  position: number
  created_at: string
}

export type Project = {
  id: string
  title: string | null
  title_en: string | null
  summary: string | null
  summary_en: string | null
  content_md: string | null
  content_md_en: string | null
  repo_url: string | null
  site_url: string | null
  click_mode: 'detail' | 'link'
  click_url: string | null
  visible: boolean
  show_on_home: boolean
  position: number
  created_at: string
  languages: Language[]
  authors: Author[]
  company: Company | null
}

export const PROJECT_SELECT =
  '*, project_languages(languages(*)), project_authors(authors(*)), companies(*)'

export type ProjectRow = Omit<Project, 'languages' | 'authors' | 'company'> & {
  project_languages: { languages: Language }[]
  project_authors: { authors: Author }[]
  companies: Company | null
}

export function mapProjectRow(row: ProjectRow): Project {
  const { project_languages, project_authors, companies, ...rest } = row
  return {
    ...rest,
    languages: project_languages.map((pl) => pl.languages),
    authors: project_authors.map((pa) => pa.authors),
    company: companies,
  }
}

export async function getLanguages(): Promise<Language[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('languages')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Language[]
}

export async function getAuthors(): Promise<Author[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Author[]
}

export async function getCompanies(): Promise<Company[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Company[]
}

export async function getVisibleProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('visible', true)
    .order('position', { ascending: false })

  if (error) throw error
  return (data as unknown as ProjectRow[]).map(mapProjectRow)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getProjectById(id: string): Promise<Project | null> {
  if (!UUID_RE.test(id)) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('id', id)
    .eq('visible', true)
    .maybeSingle()

  if (error) throw error
  return data ? mapProjectRow(data as unknown as ProjectRow) : null
}

export async function getSiteContent(): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('site_content').select('key, value')
  if (error) throw error
  return Object.fromEntries(data.map((row) => [row.key, row.value]))
}

export async function getResume(): Promise<{
  content_md: string | null
  content_md_en: string | null
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('resume')
    .select('content_md, content_md_en')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return { content_md: data?.content_md ?? null, content_md_en: data?.content_md_en ?? null }
}

export async function getResumeLinks(): Promise<ResumeLink[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('resume_links')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as ResumeLink[]
}

export async function getContactLinks(): Promise<ContactLink[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contact_links')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as ContactLink[]
}

export async function getVisibleArticles(): Promise<Article[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('visible', true)
    .order('position', { ascending: false })

  if (error) throw error
  return data as Article[]
}

export async function getArticleById(id: string): Promise<Article | null> {
  if (!UUID_RE.test(id)) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .eq('visible', true)
    .maybeSingle()

  if (error) throw error
  return data as Article | null
}

export async function insertMessage(input: {
  name: string
  email: string
  message: string
  ip: string | null
}): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('messages').insert(input)
  if (error) throw error
}

export async function countRecentMessagesFromIp(ip: string, windowMinutes: number): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('count_recent_messages_by_ip', {
    check_ip: ip,
    window_minutes: windowMinutes,
  })
  if (error) throw error
  return data as number
}
