import { createClient } from '@/lib/supabase/server'
import type {
  Project,
  Language,
  Author,
  Company,
  ProjectRow,
  ResumeLink,
  ContactLink,
  Article,
} from '@/lib/supabase/queries'
import { PROJECT_SELECT, mapProjectRow } from '@/lib/supabase/queries'
import { resolveIcon } from '@/lib/icons'

export async function addLanguage(name: string, customIconUrl?: string): Promise<Language> {
  const icon = customIconUrl ? { slug: customIconUrl, variant: null, source: 'custom' as const } : resolveIcon(name)
  const supabase = await createClient()

  const { count } = await supabase
    .from('languages')
    .select('*', { count: 'exact', head: true })

  const { data, error } = await supabase
    .from('languages')
    .insert({
      name: name.trim(),
      devicon_slug: icon?.slug ?? null,
      devicon_variant: icon?.variant ?? null,
      icon_source: icon?.source ?? null,
      position: count ?? 0,
    })
    .select()
    .single()
  if (error) throw error
  return data as Language
}

export async function setLanguagesOrder(orderedIds: string[]): Promise<void> {
  const supabase = await createClient()
  const results = await Promise.all(
    orderedIds.map((id, position) =>
      supabase.from('languages').update({ position }).eq('id', id)
    )
  )
  for (const result of results) {
    if (result.error) throw result.error
  }
}

export async function deleteLanguage(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('languages').delete().eq('id', id)
  if (error) throw error
}

export async function setLanguageShowOnHome(id: string, showOnHome: boolean): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('languages').update({ show_on_home: showOnHome }).eq('id', id)
  if (error) throw error
}

export async function updateLanguage(id: string, name: string, customIconUrl?: string): Promise<Language> {
  const icon = customIconUrl ? { slug: customIconUrl, variant: null, source: 'custom' as const } : resolveIcon(name)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('languages')
    .update({
      name: name.trim(),
      devicon_slug: icon?.slug ?? null,
      devicon_variant: icon?.variant ?? null,
      icon_source: icon?.source ?? null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Language
}

export async function getAllProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .order('position', { ascending: false })
  if (error) throw error
  return (data as unknown as ProjectRow[]).map(mapProjectRow)
}

export async function upsertProject(
  input: Partial<Omit<Project, 'languages' | 'authors' | 'company'>> & {
    id?: string
    company_id?: string | null
  }
): Promise<Omit<Project, 'languages' | 'authors' | 'company'>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .upsert(input)
    .select()
    .single()
  if (error) throw error
  return data as Omit<Project, 'languages' | 'authors' | 'company'>
}

export async function setProjectLanguages(projectId: string, languageIds: string[]): Promise<void> {
  const supabase = await createClient()
  const del = await supabase.from('project_languages').delete().eq('project_id', projectId)
  if (del.error) throw del.error
  if (languageIds.length === 0) return

  const rows = languageIds.map((language_id) => ({ project_id: projectId, language_id }))
  const { error } = await supabase.from('project_languages').insert(rows)
  if (error) throw error
}

export async function setProjectAuthors(projectId: string, authorIds: string[]): Promise<void> {
  const supabase = await createClient()
  const del = await supabase.from('project_authors').delete().eq('project_id', projectId)
  if (del.error) throw del.error
  if (authorIds.length === 0) return

  const rows = authorIds.map((author_id) => ({ project_id: projectId, author_id }))
  const { error } = await supabase.from('project_authors').insert(rows)
  if (error) throw error
}

export async function addAuthor(name: string, url: string | null): Promise<Author> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('authors')
    .insert({ name: name.trim(), url: url?.trim() || null })
    .select()
    .single()
  if (error) throw error
  return data as Author
}

export async function updateAuthor(id: string, name: string, url: string | null): Promise<Author> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('authors')
    .update({ name: name.trim(), url: url?.trim() || null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Author
}

export async function deleteAuthor(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('authors').delete().eq('id', id)
  if (error) throw error
}

export async function addCompany(
  name: string | null,
  nameEn: string | null,
  url: string | null
): Promise<Company> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .insert({ name: name?.trim() || null, name_en: nameEn?.trim() || null, url: url?.trim() || null })
    .select()
    .single()
  if (error) throw error
  return data as Company
}

export async function updateCompany(
  id: string,
  name: string | null,
  nameEn: string | null,
  url: string | null
): Promise<Company> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .update({ name: name?.trim() || null, name_en: nameEn?.trim() || null, url: url?.trim() || null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Company
}

export async function deleteCompany(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) throw error
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

export async function setProjectVisibility(id: string, visible: boolean): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').update({ visible }).eq('id', id)
  if (error) throw error
}

export async function upsertSiteContent(key: string, value: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('site_content').upsert({ key, value })
  if (error) throw error
}

export async function deleteSiteContentKey(key: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('site_content').delete().eq('key', key)
  if (error) throw error
}

export async function upsertResume(
  content_md: string | null,
  content_md_en: string | null
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume')
    .update({ content_md, content_md_en, updated_at: new Date().toISOString() })
    .eq('id', '00000000-0000-0000-0000-000000000001')
  if (error) throw error
}

export async function addResumeLink(
  label: string | null,
  label_en: string | null,
  url: string
): Promise<ResumeLink> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('resume_links')
    .select('*', { count: 'exact', head: true })

  const { data, error } = await supabase
    .from('resume_links')
    .insert({ label: label?.trim() ?? null, label_en, url: url.trim(), position: count ?? 0 })
    .select()
    .single()
  if (error) throw error
  return data as ResumeLink
}

export async function updateResumeLink(
  id: string,
  label: string | null,
  label_en: string | null,
  url: string
): Promise<ResumeLink> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('resume_links')
    .update({ label: label?.trim() ?? null, label_en, url: url.trim() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as ResumeLink
}

export async function deleteResumeLink(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('resume_links').delete().eq('id', id)
  if (error) throw error
}

export async function setResumeLinksOrder(orderedIds: string[]): Promise<void> {
  const supabase = await createClient()
  const results = await Promise.all(
    orderedIds.map((id, position) =>
      supabase.from('resume_links').update({ position }).eq('id', id)
    )
  )
  for (const result of results) {
    if (result.error) throw result.error
  }
}

export async function addContactLink(
  label: string | null,
  label_en: string | null,
  url: string
): Promise<ContactLink> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('contact_links')
    .select('*', { count: 'exact', head: true })

  const { data, error } = await supabase
    .from('contact_links')
    .insert({ label: label?.trim() ?? null, label_en, url: url.trim(), position: count ?? 0 })
    .select()
    .single()
  if (error) throw error
  return data as ContactLink
}

export async function updateContactLink(
  id: string,
  label: string | null,
  label_en: string | null,
  url: string
): Promise<ContactLink> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contact_links')
    .update({ label: label?.trim() ?? null, label_en, url: url.trim() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as ContactLink
}

export async function deleteContactLink(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('contact_links').delete().eq('id', id)
  if (error) throw error
}

export async function setContactLinksOrder(orderedIds: string[]): Promise<void> {
  const supabase = await createClient()
  const results = await Promise.all(
    orderedIds.map((id, position) =>
      supabase.from('contact_links').update({ position }).eq('id', id)
    )
  )
  for (const result of results) {
    if (result.error) throw result.error
  }
}

export async function getAllArticles(): Promise<Article[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('position', { ascending: false })
  if (error) throw error
  return data as Article[]
}

export async function upsertArticle(
  input: Partial<Article> & { id?: string }
): Promise<Article> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('articles').upsert(input).select().single()
  if (error) throw error
  return data as Article
}

export async function deleteArticle(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) throw error
}

export async function setArticleVisibility(id: string, visible: boolean): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('articles').update({ visible }).eq('id', id)
  if (error) throw error
}

export async function listMessages() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function markMessageRead(id: string, read: boolean): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('messages').update({ read }).eq('id', id)
  if (error) throw error
}

export async function deleteMessage(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('messages').delete().eq('id', id)
  if (error) throw error
}
