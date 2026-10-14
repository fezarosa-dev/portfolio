'use client'

import { useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ToastForm } from '@/components/admin/toast-form'
import { iconUrl } from '@/lib/icons'
import type { Language, LanguageCategory } from '@/lib/supabase/queries'

function GripIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
      <circle cx="2" cy="2" r="1.5" />
      <circle cx="8" cy="2" r="1.5" />
      <circle cx="2" cy="8" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="2" cy="14" r="1.5" />
      <circle cx="8" cy="14" r="1.5" />
    </svg>
  )
}

export type TechnologyDraft = {
  name: string
  nameEn: string
  categoryId: string
  iconUrl: string
  showOnHome: boolean
}

export type TechnologyChange = {
  id: string
  text?: { name: string; nameEn: string; iconUrl: string }
  categoryId?: string | null
  showOnHome?: boolean
}

export type TechnologyBatch = { order?: string[]; items: TechnologyChange[]; reindex: boolean }

const toDraft = (lang: Language): TechnologyDraft => ({
  name: lang.name,
  nameEn: lang.name_en ?? '',
  categoryId: lang.category_id ?? '',
  iconUrl: lang.icon_source === 'custom' ? (lang.devicon_slug ?? '') : '',
  showOnHome: lang.show_on_home,
})

const sameDraft = (a: TechnologyDraft, b: TechnologyDraft) =>
  a.name === b.name &&
  a.nameEn === b.nameEn &&
  a.categoryId === b.categoryId &&
  a.iconUrl === b.iconUrl &&
  a.showOnHome === b.showOnHome

function diff(lang: Language, draft: TechnologyDraft): TechnologyChange | null {
  const base = toDraft(lang)
  if (sameDraft(base, draft)) return null
  const change: TechnologyChange = { id: lang.id }
  if (draft.name !== base.name || draft.nameEn !== base.nameEn || draft.iconUrl !== base.iconUrl) {
    change.text = { name: draft.name.trim(), nameEn: draft.nameEn.trim(), iconUrl: draft.iconUrl.trim() }
  }
  if (draft.categoryId !== base.categoryId) change.categoryId = draft.categoryId || null
  if (draft.showOnHome !== base.showOnHome) change.showOnHome = draft.showOnHome
  return change
}

function TechnologyRow({
  lang,
  draft,
  dirty,
  categories,
  onChange,
  removeAction,
}: {
  lang: Language
  draft: TechnologyDraft
  dirty: boolean
  categories: LanguageCategory[]
  onChange: (patch: Partial<TechnologyDraft>) => void
  removeAction: (id: string) => Promise<void>
}) {
  const dragControls = useDragControls()

  return (
    <Reorder.Item
      value={lang}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{ scale: 1.03, boxShadow: '0 10px 24px rgba(0,0,0,0.14)', zIndex: 1 }}
      className={`flex items-center gap-2 rounded-md border bg-background px-3 py-2 ${dirty ? 'border-signal' : ''}`}
    >
      <button
        type="button"
        onPointerDown={(e) => dragControls.start(e)}
        aria-label="Arrastar para reordenar"
        className="shrink-0 cursor-grab touch-none text-steel hover:text-signal active:cursor-grabbing"
      >
        <GripIcon />
      </button>
      {lang.devicon_slug ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl(lang.devicon_slug, lang.devicon_variant ?? 'plain', lang.icon_source)}
          alt=""
          className="h-5 w-5 shrink-0"
        />
      ) : (
        <span className="shrink-0 text-xs text-destructive" title="Ícone não encontrado">
          ⚠
        </span>
      )}
      <button
        type="button"
        onClick={() => onChange({ showOnHome: !draft.showOnHome })}
        aria-pressed={draft.showOnHome}
        title={
          draft.showOnHome
            ? 'Aparece na tela inicial — clique pra tirar'
            : 'Não aparece na tela inicial — clique pra mostrar'
        }
        className={`shrink-0 text-xl ${draft.showOnHome ? 'text-signal' : 'text-steel/50'}`}
      >
        ⌂
      </button>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex gap-2">
          <Input
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            aria-label="Nome (PT)"
            placeholder="Nome (PT)"
            className="h-8"
          />
          <Input
            value={draft.nameEn}
            onChange={(e) => onChange({ nameEn: e.target.value })}
            aria-label="Nome (EN)"
            placeholder="Nome (EN, opcional)"
            className="h-8"
          />
        </div>
        <select
          value={draft.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
          aria-label="Categoria"
          className="h-7 rounded-md border bg-background px-2 text-xs"
        >
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Input
          value={draft.iconUrl}
          onChange={(e) => onChange({ iconUrl: e.target.value })}
          aria-label="URL do ícone"
          placeholder="URL do ícone (opcional)"
          className="h-7 text-xs"
        />
      </div>
      <ToastForm action={removeAction.bind(null, lang.id)} successMessage="Tecnologia removida">
        <button type="submit" className="px-1 text-muted-foreground hover:text-destructive">
          ×
        </button>
      </ToastForm>
    </Reorder.Item>
  )
}

export function TechnologyReorderList({
  languages,
  categories,
  removeAction,
  saveAction,
}: {
  languages: Language[]
  categories: LanguageCategory[]
  removeAction: (id: string) => Promise<void>
  saveAction: (batch: TechnologyBatch) => Promise<void>
}) {
  const [order, setOrder] = useState(languages)
  const [drafts, setDrafts] = useState<Record<string, TechnologyDraft>>(() =>
    Object.fromEntries(languages.map((lang) => [lang.id, toDraft(lang)]))
  )
  const [prevLanguages, setPrevLanguages] = useState(languages)
  const [saving, setSaving] = useState(false)

  if (languages !== prevLanguages) {
    // dados novos do servidor: mantém só o que ainda está sem salvar (rascunho diferente da versão anterior)
    const prevById = new Map(prevLanguages.map((lang) => [lang.id, lang]))
    setDrafts(
      Object.fromEntries(
        languages.map((lang) => {
          const prev = prevById.get(lang.id)
          const draft = drafts[lang.id]
          const unsaved = prev && draft && !sameDraft(draft, toDraft(prev))
          return [lang.id, unsaved ? draft : toDraft(lang)]
        })
      )
    )
    setPrevLanguages(languages)
    setOrder(languages)
  }

  const changes = languages.flatMap((lang) => {
    const draft = drafts[lang.id]
    const change = draft && diff(lang, draft)
    return change ? [change] : []
  })
  const orderChanged = order.some((lang, i) => lang.id !== languages[i]?.id)
  const pending = changes.length + (orderChanged ? 1 : 0)

  async function save() {
    if (changes.some((c) => c.text && !c.text.name)) {
      toast.error('Toda tecnologia precisa de nome (PT).')
      return
    }
    const reindex = changes.some((c) => c.text)
      ? window.confirm('Atualizar a busca com essas mudanças agora? (recalcula o texto pesquisável e o embedding)')
      : false
    setSaving(true)
    try {
      await saveAction({ order: orderChanged ? order.map((lang) => lang.id) : undefined, items: changes, reindex })
      toast.success('Tecnologias salvas')
    } catch {
      toast.error('Não deu pra salvar. Tenta de novo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="sticky top-0 z-10 mb-3 flex max-w-md items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
        <span className="font-mono text-xs text-steel">
          {pending > 0 ? `${pending} alteração(ões) sem salvar` : 'sem alterações'}
        </span>
        <Button type="button" size="sm" disabled={pending === 0 || saving} onClick={save}>
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
      <Reorder.Group axis="y" values={order} onReorder={setOrder} className="flex max-w-md flex-col gap-2">
        {order.map((lang) => {
          const draft = drafts[lang.id] ?? toDraft(lang)
          return (
            <TechnologyRow
              key={lang.id}
              lang={lang}
              draft={draft}
              dirty={!sameDraft(draft, toDraft(lang))}
              categories={categories}
              onChange={(patch) => setDrafts((prev) => ({ ...prev, [lang.id]: { ...draft, ...patch } }))}
              removeAction={removeAction}
            />
          )
        })}
      </Reorder.Group>
    </>
  )
}
