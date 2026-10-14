import {
  addLanguage,
  updateLanguage,
  deleteLanguage,
  setLanguagesOrder,
  setLanguageCategory,
  setLanguageShowOnHome,
  addLanguageCategory,
  updateLanguageCategory,
  deleteLanguageCategory,
  setLanguageCategoriesOrder,
  upsertProject,
  setProjectLanguages,
  setProjectAuthors,
  setProjectVisibility,
  deleteProject,
  upsertArticle,
  setArticleVisibility,
  deleteArticle,
  addAuthor,
  updateAuthor,
  deleteAuthor,
  addCompany,
  updateCompany,
  deleteCompany,
  addContactLink,
  updateContactLink,
  deleteContactLink,
  setContactLinksOrder,
  upsertSiteContent,
  deleteSiteContentKey,
} from '@/lib/supabase/admin-queries'
import { removeSearchEntry } from '@/lib/supabase/search-index'
import { createClient } from '@/lib/supabase/server'
import type { ArticleData, ChangeOp, ProjectData } from './types'

type LanguageUpdate = Extract<ChangeOp, { type: 'language.update' }>
type CategoryUpdate = Extract<ChangeOp, { type: 'category.update' }>

async function applyLanguageUpdate({ id, field, value }: LanguageUpdate) {
  if (field === 'categoryId') return setLanguageCategory(id, (value as string | null) || null)
  if (field === 'showOnHome') return setLanguageShowOnHome(id, Boolean(value))

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('languages')
    .select('name, name_en, devicon_slug, icon_source')
    .eq('id', id)
    .single()
  if (error) throw error

  const name = field === 'name' ? String(value).trim() : (data.name as string)
  if (!name) throw new Error('A tecnologia precisa de nome (PT).')
  const currentCustomIcon = data.icon_source === 'custom' ? (data.devicon_slug as string) : undefined
  const icon = field === 'iconUrl' ? String(value).trim() || undefined : currentCustomIcon
  const nameEn = field === 'nameEn' ? String(value) : (data.name_en as string | null)
  await updateLanguage(id, name, icon, nameEn)
}

async function applyCategoryUpdate({ id, field, value }: CategoryUpdate) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('language_categories').select('name, name_en').eq('id', id).single()
  if (error) throw error

  const name = field === 'name' ? value.trim() : (data.name as string)
  if (!name) throw new Error('A categoria precisa de nome.')
  const nameEn = field === 'nameEn' ? value : (data.name_en as string | null)
  await updateLanguageCategory(id, name, nameEn)
}

async function saveProject(id: string, data: ProjectData) {
  const { language_ids, author_ids, ...fields } = data
  const project = await upsertProject({ id, ...fields })
  await setProjectLanguages(project.id, language_ids)
  await setProjectAuthors(project.id, author_ids)
  if (!fields.visible) await removeSearchEntry('projects', id) // oculto sai da busca; (re)indexar é só manual
}

async function saveArticle(id: string, data: ArticleData) {
  await upsertArticle({ id, ...data })
  if (!data.visible) await removeSearchEntry('articles', id)
}

/** Aplica UMA operação da fila no banco. Lança erro se falhar. */
export async function applyOp(op: ChangeOp): Promise<void> {
  switch (op.type) {
    case 'language.add':
      if (!op.name.trim()) throw new Error('A tecnologia precisa de nome (PT).')
      await addLanguage(op.name, op.iconUrl || undefined, op.nameEn, undefined, op.id)
      return
    case 'language.update':
      return applyLanguageUpdate(op)
    case 'language.remove':
      await deleteLanguage(op.id)
      await removeSearchEntry('languages', op.id) // limpeza; (re)indexar é só manual
      return
    case 'language.order':
      return setLanguagesOrder(op.ids)
    case 'category.add':
      if (!op.name.trim()) throw new Error('A categoria precisa de nome.')
      await addLanguageCategory(op.name, op.nameEn, undefined, op.id)
      return
    case 'category.update':
      return applyCategoryUpdate(op)
    case 'category.remove':
      return deleteLanguageCategory(op.id)
    case 'category.order':
      return setLanguageCategoriesOrder(op.ids)
    case 'project.add':
    case 'project.update':
      return saveProject(op.id, op.data)
    case 'project.visible':
      await setProjectVisibility(op.id, op.visible)
      if (!op.visible) await removeSearchEntry('projects', op.id)
      return
    case 'project.remove':
      await deleteProject(op.id)
      await removeSearchEntry('projects', op.id)
      return
    case 'article.add':
    case 'article.update':
      return saveArticle(op.id, op.data)
    case 'article.visible':
      await setArticleVisibility(op.id, op.visible)
      if (!op.visible) await removeSearchEntry('articles', op.id)
      return
    case 'article.remove':
      await deleteArticle(op.id)
      await removeSearchEntry('articles', op.id)
      return
    case 'author.add':
      if (!op.data.name.trim()) throw new Error('O autor precisa de nome.')
      await addAuthor(op.data.name, op.data.url, undefined, op.id)
      return
    case 'author.update':
      if (!op.data.name.trim()) throw new Error('O autor precisa de nome.')
      await updateAuthor(op.id, op.data.name, op.data.url)
      return
    case 'author.remove':
      return deleteAuthor(op.id)
    case 'company.add':
      if (!op.data.name && !op.data.name_en) throw new Error('A empresa precisa de nome (PT ou EN).')
      await addCompany(op.data.name, op.data.name_en, op.data.url, undefined, op.id)
      return
    case 'company.update':
      if (!op.data.name && !op.data.name_en) throw new Error('A empresa precisa de nome (PT ou EN).')
      await updateCompany(op.id, op.data.name, op.data.name_en, op.data.url)
      return
    case 'company.remove':
      return deleteCompany(op.id)
    case 'contact.add':
      if (!op.data.url.trim()) throw new Error('O contato precisa de link.')
      await addContactLink(op.data.label, op.data.label_en, op.data.url, undefined, op.id)
      return
    case 'contact.update':
      if (!op.data.url.trim()) throw new Error('O contato precisa de link.')
      await updateContactLink(op.id, op.data.label, op.data.label_en, op.data.url)
      return
    case 'contact.remove':
      return deleteContactLink(op.id)
    case 'contact.order':
      return setContactLinksOrder(op.ids)
    case 'site.set':
      return upsertSiteContent(op.key, op.value)
    case 'site.delete':
      return deleteSiteContentKey(op.key)
  }
}
