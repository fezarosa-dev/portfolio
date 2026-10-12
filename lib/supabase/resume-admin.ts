import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/** Tabelas editáveis do autocurrículo (whitelist: o nome vem de fora, nunca confie nele direto). */
export const RESUME_TABLES = {
  experiences: 'resume_experiences',
  education: 'resume_education',
  spoken: 'resume_spoken_languages',
  certifications: 'resume_certifications',
  skill_categories: 'resume_skill_categories',
  skills: 'resume_skills',
} as const

export type ResumeEntity = keyof typeof RESUME_TABLES

export function isResumeEntity(value: string): value is ResumeEntity {
  return value in RESUME_TABLES
}

async function db(client?: SupabaseClient) {
  return client ?? (await createClient())
}

/** Cria (no fim da lista) ou atualiza uma linha. `scope` limita a ordem (ex.: habilidades de uma categoria). */
export async function saveResumeItem(
  entity: ResumeEntity,
  id: string | null,
  values: Record<string, unknown>,
  scope?: { column: string; value: string },
  client?: SupabaseClient
): Promise<void> {
  const supabase = await db(client)
  const table = RESUME_TABLES[entity]
  if (id) {
    const { error } = await supabase.from(table).update(values).eq('id', id)
    if (error) throw error
    return
  }
  let last = supabase.from(table).select('position').order('position', { ascending: false }).limit(1)
  if (scope) last = last.eq(scope.column, scope.value)
  const { data, error: readError } = await last
  if (readError) throw readError
  const position = (data?.[0]?.position ?? -1) + 1
  const { error } = await supabase.from(table).insert({ ...values, position })
  if (error) throw error
}

export async function deleteResumeItem(entity: ResumeEntity, id: string, client?: SupabaseClient): Promise<void> {
  const supabase = await db(client)
  const { error } = await supabase.from(RESUME_TABLES[entity]).delete().eq('id', id)
  if (error) throw error
}

/** Troca de lugar com o vizinho (dir -1 = sobe, +1 = desce) e regrava as posições 0..n-1. */
export async function moveResumeItem(
  entity: ResumeEntity,
  id: string,
  dir: -1 | 1,
  scope?: { column: string; value: string },
  client?: SupabaseClient
): Promise<void> {
  const supabase = await db(client)
  const table = RESUME_TABLES[entity]
  let query = supabase.from(table).select('id').order('position', { ascending: true }).order('created_at', { ascending: true })
  if (scope) query = query.eq(scope.column, scope.value)
  const { data, error } = await query
  if (error) throw error
  const ids = (data ?? []).map((row) => row.id as string)
  const from = ids.indexOf(id)
  const to = from + dir
  if (from < 0 || to < 0 || to >= ids.length) return
  ;[ids[from], ids[to]] = [ids[to], ids[from]]
  await Promise.all(ids.map((rowId, position) => supabase.from(table).update({ position }).eq('id', rowId)))
}

export async function saveResumeProfile(values: Record<string, string | null>, client?: SupabaseClient): Promise<void> {
  const supabase = await db(client)
  const { data, error: readError } = await supabase.from('resume').select('id').limit(1).maybeSingle()
  if (readError) throw readError
  const { error } = data
    ? await supabase.from('resume').update(values).eq('id', data.id)
    : await supabase.from('resume').insert(values)
  if (error) throw error
}

/** Marca/desmarca um projeto no currículo; ao incluir, o trigger do banco manda ele pro fim da ordem. */
export async function setProjectInResume(projectId: string, inResume: boolean, client?: SupabaseClient): Promise<void> {
  const supabase = await db(client)
  const { error } = await supabase.from('projects').update({ in_resume: inResume }).eq('id', projectId)
  if (error) throw error
}

export async function moveProjectInResume(projectId: string, dir: -1 | 1, client?: SupabaseClient): Promise<void> {
  const supabase = await db(client)
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('in_resume', true)
    .order('resume_position', { ascending: true })
  if (error) throw error
  const ids = (data ?? []).map((row) => row.id as string)
  const from = ids.indexOf(projectId)
  const to = from + dir
  if (from < 0 || to < 0 || to >= ids.length) return
  ;[ids[from], ids[to]] = [ids[to], ids[from]]
  await Promise.all(ids.map((id, resume_position) => supabase.from('projects').update({ resume_position }).eq('id', id)))
}

/** Copia as categorias de tecnologias que ainda não existem como categoria de habilidade. */
export async function importTechCategories(client?: SupabaseClient): Promise<number> {
  const supabase = await db(client)
  const [{ data: tech, error: e1 }, { data: mine, error: e2 }] = await Promise.all([
    supabase.from('language_categories').select('name, name_en').order('position'),
    supabase.from('resume_skill_categories').select('name, position'),
  ])
  if (e1 || e2) throw e1 ?? e2
  const existing = new Set((mine ?? []).map((c) => (c.name ?? '').toLowerCase()))
  const missing = (tech ?? []).filter((c) => !existing.has((c.name ?? '').toLowerCase()))
  const start = Math.max(-1, ...(mine ?? []).map((c) => c.position)) + 1
  if (missing.length) {
    const { error } = await supabase
      .from('resume_skill_categories')
      .insert(missing.map((c, i) => ({ name: c.name, name_en: c.name_en, position: start + i })))
    if (error) throw error
  }
  return missing.length
}
