'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ToastForm } from '@/components/admin/toast-form'
import type { LanguageCategory } from '@/lib/supabase/queries'

type Draft = { name: string; nameEn: string }

export type CategoryBatch = { order?: string[]; items: { id: string; name: string; nameEn: string }[] }

const toDraft = (c: LanguageCategory): Draft => ({ name: c.name, nameEn: c.name_en ?? '' })
const sameDraft = (a: Draft, b: Draft) => a.name === b.name && a.nameEn === b.nameEn

export function CategoryList({
  categories,
  removeAction,
  saveAction,
}: {
  categories: LanguageCategory[]
  removeAction: (id: string) => Promise<void>
  saveAction: (batch: CategoryBatch) => Promise<void>
}) {
  const [order, setOrder] = useState(categories.map((c) => c.id))
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, toDraft(c)]))
  )
  const [prevCategories, setPrevCategories] = useState(categories)
  const [saving, setSaving] = useState(false)

  if (categories !== prevCategories) {
    // dados novos do servidor: mantém só o que ainda está sem salvar
    const prevById = new Map(prevCategories.map((c) => [c.id, c]))
    setDrafts(
      Object.fromEntries(
        categories.map((c) => {
          const prev = prevById.get(c.id)
          const draft = drafts[c.id]
          const unsaved = prev && draft && !sameDraft(draft, toDraft(prev))
          return [c.id, unsaved ? draft : toDraft(c)]
        })
      )
    )
    setPrevCategories(categories)
    setOrder(categories.map((c) => c.id))
  }

  const byId = new Map(categories.map((c) => [c.id, c]))
  const items = categories.flatMap((c) => {
    const draft = drafts[c.id]
    return draft && !sameDraft(draft, toDraft(c)) ? [{ id: c.id, name: draft.name.trim(), nameEn: draft.nameEn.trim() }] : []
  })
  const orderChanged = order.some((id, i) => id !== categories[i]?.id)
  const pending = items.length + (orderChanged ? 1 : 0)

  function move(index: number, direction: -1 | 1) {
    const to = index + direction
    if (to < 0 || to >= order.length) return
    setOrder((prev) => {
      const next = [...prev]
      ;[next[index], next[to]] = [next[to], next[index]]
      return next
    })
  }

  async function save() {
    if (items.some((item) => !item.name)) {
      toast.error('Toda categoria precisa de nome.')
      return
    }
    setSaving(true)
    try {
      await saveAction({ order: orderChanged ? order : undefined, items })
      toast.success('Categorias salvas')
    } catch {
      toast.error('Não deu pra salvar. Tenta de novo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
        <span className="font-mono text-xs text-steel">
          {pending > 0 ? `${pending} alteração(ões) sem salvar` : 'sem alterações'}
        </span>
        <Button type="button" size="sm" disabled={pending === 0 || saving} onClick={save}>
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
      <ul className="mb-3 flex flex-col gap-2">
        {order.map((id, i) => {
          const category = byId.get(id)
          if (!category) return null
          const draft = drafts[id] ?? toDraft(category)
          const dirty = !sameDraft(draft, toDraft(category))
          return (
            <li
              key={id}
              className={`flex items-center gap-2 rounded-md border bg-background px-3 py-2 ${dirty ? 'border-signal' : ''}`}
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
                disabled={i === order.length - 1}
                aria-label="Descer"
                className="px-1 text-steel hover:text-signal disabled:opacity-30"
              >
                ↓
              </button>
              <Input
                value={draft.name}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [id]: { ...draft, name: e.target.value } }))}
                aria-label="Nome"
                className="h-8"
              />
              <Input
                value={draft.nameEn}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [id]: { ...draft, nameEn: e.target.value } }))}
                aria-label="Nome (EN)"
                placeholder="Inglês"
                className="h-8"
              />
              <ToastForm action={removeAction.bind(null, id)} successMessage="Categoria removida">
                <button type="submit" className="px-1 text-muted-foreground hover:text-destructive">
                  ×
                </button>
              </ToastForm>
            </li>
          )
        })}
      </ul>
    </>
  )
}
