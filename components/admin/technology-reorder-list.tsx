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

function TechnologyRow({
  lang,
  categories,
  onDragEnd,
  editAction,
  removeAction,
  showOnHome,
  onToggleShowOnHome,
}: {
  lang: Language
  categories: LanguageCategory[]
  onDragEnd: () => void
  editAction: (id: string, formData: FormData) => Promise<void>
  removeAction: (id: string) => Promise<void>
  showOnHome: boolean
  onToggleShowOnHome: () => void
}) {
  const dragControls = useDragControls()

  return (
    <Reorder.Item
      value={lang}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      whileDrag={{
        scale: 1.03,
        boxShadow: '0 10px 24px rgba(0,0,0,0.14)',
        zIndex: 1,
      }}
      className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"
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
        onClick={onToggleShowOnHome}
        aria-pressed={showOnHome}
        title={
          showOnHome
            ? 'Aparece na tela inicial — clique pra tirar (e salve lá em cima)'
            : 'Não aparece na tela inicial — clique pra mostrar (e salve lá em cima)'
        }
        className={`shrink-0 text-xl ${showOnHome ? 'text-signal' : 'text-steel/50'}`}
      >
        ⌂
      </button>
      <ToastForm
        action={editAction.bind(null, lang.id)}
        successMessage="Tecnologia atualizada"
        className="flex flex-1 flex-col gap-1"
        confirmReindex
      >
        <div className="flex gap-2">
          <Input name="name" defaultValue={lang.name} placeholder="Nome (PT)" className="h-8" />
          <Input
            name="name_en"
            defaultValue={lang.name_en ?? ''}
            placeholder="Nome (EN, opcional)"
            className="h-8"
          />
          <Button type="submit" variant="outline" size="sm">
            Salvar
          </Button>
        </div>
        <select
          name="categoryId"
          defaultValue={lang.category_id ?? ''}
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
          name="iconUrl"
          defaultValue={lang.icon_source === 'custom' ? (lang.devicon_slug ?? '') : ''}
          placeholder="URL do ícone (opcional)"
          className="h-7 text-xs"
        />
      </ToastForm>
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
  editAction,
  removeAction,
  saveOrderAction,
  saveShowOnHomeAction,
}: {
  languages: Language[]
  categories: LanguageCategory[]
  editAction: (id: string, formData: FormData) => Promise<void>
  removeAction: (id: string) => Promise<void>
  saveOrderAction: (orderedIds: string[]) => Promise<void>
  saveShowOnHomeAction: (changes: { id: string; showOnHome: boolean }[]) => Promise<void>
}) {
  const [homeEdits, setHomeEdits] = useState<Record<string, boolean>>({})
  const [savingHome, setSavingHome] = useState(false)
  const [order, setOrder] = useState(languages)
  const [prevLanguages, setPrevLanguages] = useState(languages)

  if (languages !== prevLanguages) {
    setPrevLanguages(languages)
    setOrder(languages)
    setHomeEdits({})
  }

  const homeValue = (lang: Language) => homeEdits[lang.id] ?? lang.show_on_home
  const changes = languages
    .filter((lang) => homeEdits[lang.id] !== undefined && homeEdits[lang.id] !== lang.show_on_home)
    .map((lang) => ({ id: lang.id, showOnHome: homeEdits[lang.id] }))

  async function saveHome() {
    setSavingHome(true)
    try {
      await saveShowOnHomeAction(changes)
      toast.success('Visibilidade na home salva')
    } catch {
      toast.error('Não deu pra salvar. Tenta de novo.')
    } finally {
      setSavingHome(false)
    }
  }

  async function handleDragEnd() {
    try {
      await saveOrderAction(order.map((lang) => lang.id))
    } catch {
      toast.error('Não deu pra salvar a nova ordem. Tenta de novo.')
    }
  }

  return (
    <>
      <div className="sticky top-0 z-10 mb-3 flex max-w-md items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
        <span className="font-mono text-xs text-steel">
          {changes.length > 0
            ? `${changes.length} alteração(ões) de visibilidade na home`
            : 'visibilidade na home (⌂) sem alterações'}
        </span>
        <Button type="button" size="sm" disabled={changes.length === 0 || savingHome} onClick={saveHome}>
          {savingHome ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
      <Reorder.Group axis="y" values={order} onReorder={setOrder} className="flex max-w-md flex-col gap-2">
        {order.map((lang) => (
          <TechnologyRow
            key={lang.id}
            lang={lang}
            categories={categories}
            onDragEnd={handleDragEnd}
            editAction={editAction}
            removeAction={removeAction}
            showOnHome={homeValue(lang)}
            onToggleShowOnHome={() => setHomeEdits((prev) => ({ ...prev, [lang.id]: !homeValue(lang) }))}
          />
        ))}
      </Reorder.Group>
    </>
  )
}
