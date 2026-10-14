import { resolveIcon } from '../icons.ts'
import type { Language, LanguageCategory } from '../supabase/queries.ts'
import type { Change } from './types.ts'

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
export function touchedIds(stack: Change[], entity: 'language' | 'category'): Set<string> {
  const ids = new Set<string>()
  for (const { op } of stack) {
    if (!op.type.startsWith(`${entity}.`) || op.type.endsWith('.order') || op.type.endsWith('.remove')) continue
    ids.add((op as { id: string }).id)
  }
  return ids
}
