import { resolveIcon } from '../icons.ts'
import type { Article, Author, Company, ContactLink, Language, LanguageCategory, Project } from '../supabase/queries.ts'
import type { ArticleData, Change, ProjectData } from './types.ts'

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
  entity: 'language' | 'category' | 'project' | 'article' | 'author' | 'company' | 'contact'
): Set<string> {
  const ids = new Set<string>()
  for (const { op } of stack) {
    if (!op.type.startsWith(`${entity}.`) || op.type.endsWith('.order') || op.type.endsWith('.remove')) continue
    ids.add((op as { id: string }).id)
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
