'use client'

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { useChanges } from '@/components/admin/changes-provider'
import { overlayCategories, touchedIds } from '@/lib/changes/overlay'
import type { LanguageCategory } from '@/lib/supabase/queries'

export function CategoryList({ categories }: { categories: LanguageCategory[] }) {
  const { changes, enqueue } = useChanges()
  const effective = useMemo(() => overlayCategories(categories, changes), [categories, changes])
  const touched = useMemo(() => touchedIds(changes, 'category'), [changes])

  function move(index: number, direction: -1 | 1) {
    const to = index + direction
    if (to < 0 || to >= effective.length) return
    const ids = effective.map((c) => c.id)
    ;[ids[index], ids[to]] = [ids[to], ids[index]]
    enqueue({ type: 'category.order', ids }, 'Categorias: nova ordem')
  }

  return (
    <ul className="mb-3 flex flex-col gap-2">
      {effective.map((category, i) => (
        <li
          key={category.id}
          className={`flex items-center gap-2 rounded-md border bg-background px-3 py-2 ${touched.has(category.id) ? 'border-orange-500' : ''}`}
        >
          <button
            type="button"
            onClick={() => move(i, -1)}
            disabled={i === 0}
            aria-label="Subir"
            className="px-1 text-steel hover:text-signal disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => move(i, 1)}
            disabled={i === effective.length - 1}
            aria-label="Descer"
            className="px-1 text-steel hover:text-signal disabled:opacity-30"
          >
            ↓
          </button>
          <Input
            key={category.name}
            defaultValue={category.name}
            aria-label="Nome"
            className="h-8"
            onBlur={(e) => {
              const value = e.target.value.trim()
              if (value && value !== category.name) {
                enqueue(
                  { type: 'category.update', id: category.id, field: 'name', value },
                  `Categoria “${category.name}”: nome → “${value}”`
                )
              } else {
                e.target.value = category.name
              }
            }}
          />
          <Input
            key={category.name_en ?? ''}
            defaultValue={category.name_en ?? ''}
            aria-label="Nome (EN)"
            placeholder="Inglês"
            className="h-8"
            onBlur={(e) => {
              const value = e.target.value.trim()
              if (value !== (category.name_en ?? '')) {
                enqueue(
                  { type: 'category.update', id: category.id, field: 'nameEn', value },
                  `Categoria “${category.name}”: nome EN → “${value || '(vazio)'}”`
                )
              }
            }}
          />
          <button
            type="button"
            onClick={() => enqueue({ type: 'category.remove', id: category.id }, `Categoria “${category.name}”: remover`)}
            aria-label="Remover"
            className="px-1 text-muted-foreground hover:text-destructive"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}
