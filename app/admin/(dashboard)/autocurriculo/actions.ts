'use server'

import { revalidatePath, updateTag } from 'next/cache'
import {
  saveResumeItem,
  deleteResumeItem,
  moveResumeItem,
  saveResumeProfile,
  setProjectInResume,
  moveProjectInResume,
  importTechCategories,
  isResumeEntity,
  type ResumeEntity,
} from '@/lib/supabase/resume-admin'
import { ENTITIES, parseEntityForm, type ConfigEntity } from './config'

function refresh() {
  revalidatePath('/admin/autocurriculo')
  updateTag('site') // currículo público e PDF usam o cache 'site'
}

function entityOrThrow(entity: string): ResumeEntity {
  if (!isResumeEntity(entity)) throw new Error('entidade inválida')
  return entity
}

export async function saveProfile(formData: FormData) {
  const text = (name: string) => String(formData.get(name) ?? '').trim() || null
  await saveResumeProfile({
    full_name: text('full_name'),
    headline: text('headline'),
    headline_en: text('headline_en'),
    location: text('location'),
    location_en: text('location_en'),
    summary: text('summary'),
    summary_en: text('summary_en'),
  })
  refresh()
}

export async function saveItem(entity: string, formData: FormData) {
  const e = entityOrThrow(entity)
  const id = String(formData.get('id') ?? '') || null
  if (e === 'skills') {
    const categoryId = String(formData.get('category_id') ?? '')
    const languageId = String(formData.get('language_id') ?? '') || null
    const label = String(formData.get('label') ?? '').trim() || null
    if (!categoryId || (!languageId && !label)) throw new Error('escolha uma tecnologia ou escreva a habilidade')
    await saveResumeItem(
      e,
      id,
      { category_id: categoryId, language_id: languageId, label: languageId ? null : label, label_en: languageId ? null : String(formData.get('label_en') ?? '').trim() || null },
      { column: 'category_id', value: categoryId }
    )
  } else {
    await saveResumeItem(e, id, parseEntityForm(ENTITIES[e as ConfigEntity].fields, formData))
  }
  refresh()
}

export async function removeItem(entity: string, id: string) {
  await deleteResumeItem(entityOrThrow(entity), id)
  refresh()
}

export async function moveItem(entity: string, id: string, dir: -1 | 1, categoryId?: string) {
  await moveResumeItem(entityOrThrow(entity), id, dir, categoryId ? { column: 'category_id', value: categoryId } : undefined)
  refresh()
}

export async function toggleProject(id: string, inResume: boolean) {
  await setProjectInResume(id, inResume)
  refresh()
}

export async function moveProject(id: string, dir: -1 | 1) {
  await moveProjectInResume(id, dir)
  refresh()
}

export async function importCategories() {
  await importTechCategories()
  refresh()
}
