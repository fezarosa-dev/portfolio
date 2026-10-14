import { resolveIcon } from '../icons.ts'
import type { Article, Author, Company, ContactLink, Language, LanguageCategory, Project } from '../supabase/queries.ts'
import type { ResumeSource } from '../resume.ts'
import type { ArticleData, Change, ProjectData, ResumeEntity } from './types.ts'

type Positioned = { id: string; position: number }

function applyOrder<T extends Positioned>(rows: T[], ids: string[]): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]))
  const listed = ids.flatMap((id) => (byId.has(id) ? [byId.get(id) as T] : []))
  const rest = rows.filter((row) => !ids.includes(row.id))
  return [...listed, ...rest].map((row, position) => ({ ...row, position }))
}

function iconFields(name: string, custom?: string): Pick<Language, 'devicon_slug' | 'devicon_variant' | 'icon_source'> {
  if (custom) return { devicon_slug: custom, devicon_variant: null, icon_source: 'custom' }
  const icon = resolveIcon(name)
  return { devicon_slug: icon?.slug ?? null, devicon_variant: icon?.variant ?? null, icon_source: icon?.source ?? null }
}

/** Dados do servidor + fila pendente (aplicada do mais antigo pro mais novo). */
export function overlayLanguages(base: Language[], stack: Change[]): Language[] {
  let rows = base.map((row) => ({ ...row }))
  for (const { op } of [...stack].reverse()) {
    switch (op.type) {
      case 'language.add':
        rows = [
          ...rows,
          {
            id: op.id,
            name: op.name,
            name_en: op.nameEn || null,
            ...iconFields(op.name, op.iconUrl),
            position: rows.length,
            show_on_home: true,
            category_id: null,
          },
        ]
        break
      case 'language.update':
        rows = rows.map((row) => {
          if (row.id !== op.id) return row
          switch (op.field) {
            case 'name': {
              const name = String(op.value)
              return { ...row, name, ...(row.icon_source === 'custom' ? {} : iconFields(name)) }
            }
            case 'nameEn':
              return { ...row, name_en: String(op.value) || null }
            case 'categoryId':
              return { ...row, category_id: (op.value as string | null) || null }
            case 'iconUrl':
              return { ...row, ...iconFields(row.name, String(op.value)) }
            case 'showOnHome':
              return { ...row, show_on_home: Boolean(op.value) }
            default:
              return row
          }
        })
        break
      case 'language.remove':
        rows = rows.filter((row) => row.id !== op.id)
        break
      case 'language.order':
        rows = applyOrder(rows, op.ids)
        break
      default:
        break
    }
  }
  return rows
}

export function overlayCategories(base: LanguageCategory[], stack: Change[]): LanguageCategory[] {
  let rows = base.map((row) => ({ ...row }))
  for (const { op } of [...stack].reverse()) {
    switch (op.type) {
      case 'category.add':
        rows = [...rows, { id: op.id, name: op.name, name_en: op.nameEn || null, position: rows.length }]
        break
      case 'category.update':
        rows = rows.map((row) =>
          row.id !== op.id
            ? row
            : op.field === 'name'
              ? { ...row, name: op.value }
              : { ...row, name_en: op.value || null }
        )
        break
      case 'category.remove':
        rows = rows.filter((row) => row.id !== op.id)
        break
      case 'category.order':
        rows = applyOrder(rows, op.ids)
        break
      default:
        break
    }
  }
  return rows
}

/** Ids com edição ou criação pendente (pra borda laranja). Ordenar e apagar não contam. */
export function touchedIds(
  stack: Change[],
  entity: 'language' | 'category' | 'project' | 'article' | 'author' | 'company' | 'contact' | 'resume'
): Set<string> {
  const ids = new Set<string>()
  for (const { op } of stack) {
    if (!op.type.startsWith(`${entity}.`) || op.type.endsWith('.order') || op.type.endsWith('.remove')) continue
    if ('id' in op) ids.add(op.id)
  }
  return ids
}

export type ProjectContext = { languages: Language[]; authors: Author[]; companies: Company[] }

function projectFrom(base: Project | null, id: string, data: ProjectData, ctx: ProjectContext): Project {
  const { language_ids, author_ids, company_id, ...fields } = data
  const pick = <T extends { id: string }>(all: T[], ids: string[]) => ids.flatMap((i) => all.filter((x) => x.id === i))
  return {
    slug: '',
    created_at: new Date(0).toISOString(),
    resume_position: 0,
    ...base,
    id,
    ...fields,
    languages: pick(ctx.languages, language_ids),
    authors: pick(ctx.authors, author_ids),
    company: ctx.companies.find((c) => c.id === company_id) ?? null,
  }
}

/** Lista de projetos do admin (ordem: position desc) + fila pendente. */
export function overlayProjects(base: Project[], stack: Change[], ctx: ProjectContext): Project[] {
  let rows = [...base]
  for (const { op } of [...stack].reverse()) {
    switch (op.type) {
      case 'project.add':
        rows = [...rows, projectFrom(null, op.id, op.data, ctx)]
        break
      case 'project.update':
        rows = rows.map((row) => (row.id === op.id ? projectFrom(row, op.id, op.data, ctx) : row))
        break
      case 'project.visible':
        rows = rows.map((row) => (row.id === op.id ? { ...row, visible: op.visible } : row))
        break
      case 'project.remove':
        rows = rows.filter((row) => row.id !== op.id)
        break
      default:
        break
    }
  }
  return [...rows].sort((a, b) => b.position - a.position)
}

function articleFrom(base: Article | null, id: string, data: ArticleData): Article {
  return { created_at: new Date(0).toISOString(), ...base, id, ...data }
}

export function overlayArticles(base: Article[], stack: Change[]): Article[] {
  let rows = [...base]
  for (const { op } of [...stack].reverse()) {
    switch (op.type) {
      case 'article.add':
        rows = [...rows, articleFrom(null, op.id, op.data)]
        break
      case 'article.update':
        rows = rows.map((row) => (row.id === op.id ? articleFrom(row, op.id, op.data) : row))
        break
      case 'article.visible':
        rows = rows.map((row) => (row.id === op.id ? { ...row, visible: op.visible } : row))
        break
      case 'article.remove':
        rows = rows.filter((row) => row.id !== op.id)
        break
      default:
        break
    }
  }
  return [...rows].sort((a, b) => b.position - a.position)
}

export function overlayAuthors(base: Author[], stack: Change[]): Author[] {
  let rows = [...base]
  for (const { op } of [...stack].reverse()) {
    switch (op.type) {
      case 'author.add':
        rows = [...rows, { id: op.id, ...op.data }]
        break
      case 'author.update':
        rows = rows.map((row) => (row.id === op.id ? { ...row, ...op.data } : row))
        break
      case 'author.remove':
        rows = rows.filter((row) => row.id !== op.id)
        break
      default:
        break
    }
  }
  return rows
}

export function overlayCompanies(base: Company[], stack: Change[]): Company[] {
  let rows = [...base]
  for (const { op } of [...stack].reverse()) {
    switch (op.type) {
      case 'company.add':
        rows = [...rows, { id: op.id, ...op.data }]
        break
      case 'company.update':
        rows = rows.map((row) => (row.id === op.id ? { ...row, ...op.data } : row))
        break
      case 'company.remove':
        rows = rows.filter((row) => row.id !== op.id)
        break
      default:
        break
    }
  }
  return rows
}

export function overlayContactLinks(base: ContactLink[], stack: Change[]): ContactLink[] {
  let rows = base.map((row) => ({ ...row }))
  for (const { op } of [...stack].reverse()) {
    switch (op.type) {
      case 'contact.add':
        rows = [...rows, { id: op.id, ...op.data, position: rows.length }]
        break
      case 'contact.update':
        rows = rows.map((row) => (row.id === op.id ? { ...row, ...op.data } : row))
        break
      case 'contact.remove':
        rows = rows.filter((row) => row.id !== op.id)
        break
      case 'contact.order':
        rows = applyOrder(rows, op.ids)
        break
      default:
        break
    }
  }
  return rows
}

export function overlaySiteContent(base: Record<string, string>, stack: Change[]): Record<string, string> {
  const content = { ...base }
  for (const { op } of [...stack].reverse()) {
    if (op.type === 'site.set') content[op.key] = op.value
    else if (op.type === 'site.delete') delete content[op.key]
  }
  return content
}

const RESUME_LISTS = {
  experiences: 'experiences',
  education: 'education',
  spoken: 'spoken',
  certifications: 'certifications',
  skill_categories: 'categories',
  skills: 'skills',
} as const satisfies Record<ResumeEntity, keyof ResumeSource>

type Row = Record<string, unknown> & { id: string; position: number }

/** Currículo estruturado + fila pendente (perfil, listas e ordens). Os projetos do currículo vêm de overlayResumeProjects. */
export function overlayResume(source: ResumeSource, stack: Change[]): ResumeSource {
  const lists: Record<ResumeEntity, Row[]> = {
    experiences: [], education: [], spoken: [], certifications: [], skill_categories: [], skills: [],
  }
  for (const entity of Object.keys(RESUME_LISTS) as ResumeEntity[]) {
    lists[entity] = (source[RESUME_LISTS[entity]] as unknown as Row[]).map((row) => ({ ...row }))
  }
  let profile: ResumeSource['profile'] = source.profile ? { ...source.profile } : null

  for (const { op } of [...stack].reverse()) {
    switch (op.type) {
      case 'resume.profile':
        profile = {
          full_name: null, headline: null, headline_en: null, location: null, location_en: null, summary: null, summary_en: null,
          ...profile,
          ...op.values,
        }
        break
      case 'resume.add': {
        const list = lists[op.entity]
        const position = Math.max(-1, ...list.map((row) => row.position)) + 1
        lists[op.entity] = [...list, { ...op.data, id: op.id, position }]
        break
      }
      case 'resume.update':
        lists[op.entity] = lists[op.entity].map((row) => (row.id === op.id ? { ...row, ...op.data } : row))
        break
      case 'resume.remove':
        lists[op.entity] = lists[op.entity].filter((row) => row.id !== op.id)
        break
      case 'resume.order': {
        const rows = lists[op.entity]
        const inScope = (row: Row) => !op.scopeId || row.category_id === op.scopeId
        const ordered = applyOrder(rows.filter(inScope), op.ids)
        const byId = new Map(ordered.map((row) => [row.id, row]))
        lists[op.entity] = rows.map((row) => byId.get(row.id) ?? row)
        break
      }
      default:
        break
    }
  }

  const sorted = (rows: Row[]) => [...rows].sort((a, b) => a.position - b.position)
  return {
    ...source,
    profile,
    experiences: sorted(lists.experiences) as unknown as ResumeSource['experiences'],
    education: sorted(lists.education) as unknown as ResumeSource['education'],
    spoken: sorted(lists.spoken) as unknown as ResumeSource['spoken'],
    certifications: sorted(lists.certifications) as unknown as ResumeSource['certifications'],
    categories: sorted(lists.skill_categories) as unknown as ResumeSource['categories'],
    skills: sorted(lists.skills) as unknown as ResumeSource['skills'],
  }
}

/** Projetos já com as mudanças de projeto aplicadas + quem entra no currículo e em que ordem. */
export function overlayResumeProjects(projects: Project[], stack: Change[]): Project[] {
  let rows = projects.map((row) => ({ ...row }))
  for (const { op } of [...stack].reverse()) {
    if (op.type === 'resume.project') {
      const last = Math.max(-1, ...rows.filter((row) => row.in_resume).map((row) => row.resume_position))
      rows = rows.map((row) =>
        row.id !== op.id ? row : { ...row, in_resume: op.inResume, resume_position: op.inResume && !row.in_resume ? last + 1 : row.resume_position }
      )
    } else if (op.type === 'resume.projectOrder') {
      rows = rows.map((row) => (op.ids.includes(row.id) ? { ...row, resume_position: op.ids.indexOf(row.id) } : row))
    }
  }
  return rows
}
