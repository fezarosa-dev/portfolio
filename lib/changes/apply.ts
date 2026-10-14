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
} from '@/lib/supabase/admin-queries'
import { removeSearchEntry } from '@/lib/supabase/search-index'
import { createClient } from '@/lib/supabase/server'
import type { ChangeOp } from './types'

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
  }
}
