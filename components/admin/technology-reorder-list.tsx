'use client'

import { useMemo, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { useChanges } from '@/components/admin/changes-provider'
import { overlayCategories, overlayLanguages, touchedIds } from '@/lib/changes/overlay'
import type { LanguageField } from '@/lib/changes/types'
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

type OnUpdate = (field: LanguageField, value: string | boolean | null, what: string) => void

function TechnologyRow({
  lang,
  categories,
  touched,
  onUpdate,
  onRemove,
  onDragEnd,
}: {
  lang: Language
  categories: LanguageCategory[]
  touched: boolean
  onUpdate: OnUpdate
  onRemove: () => void
  onDragEnd: () => void
}) {
  const dragControls = useDragControls()
  const customIcon = lang.icon_source === 'custom' ? (lang.devicon_slug ?? '') : ''

  return (
    <Reorder.Item
      value={lang}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.03, boxShadow: '0 10px 24px rgba(0,0,0,0.14)', zIndex: 1 }}
      className={`flex items-center gap-2 rounded-md border bg-background px-3 py-2 ${touched ? 'border-orange-500' : ''}`}
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
        onClick={() => onUpdate('showOnHome', !lang.show_on_home, lang.show_on_home ? 'tirar da home' : 'mostrar na home')}
        aria-pressed={lang.show_on_home}
        title={
          lang.show_on_home
            ? 'Aparece na tela inicial — clique pra tirar'
            : 'Não aparece na tela inicial — clique pra mostrar'
        }
        className={`shrink-0 text-xl ${lang.show_on_home ? 'text-signal' : 'text-steel/50'}`}
      >
        ⌂
      </button>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex gap-2">
          <Input
            key={lang.name}
            defaultValue={lang.name}
            aria-label="Nome (PT)"
            placeholder="Nome (PT)"
            className="h-8"
            onBlur={(e) => {
              const value = e.target.value.trim()
              if (value && value !== lang.name) onUpdate('name', value, `nome PT → “${value}”`)
              else e.target.value = lang.name
            }}
          />
          <Input
            key={lang.name_en ?? ''}
            defaultValue={lang.name_en ?? ''}
            aria-label="Nome (EN)"
            placeholder="Nome (EN, opcional)"
            className="h-8"
            onBlur={(e) => {
              const value = e.target.value.trim()
              if (value !== (lang.name_en ?? '')) onUpdate('nameEn', value, `nome EN → “${value || '(vazio)'}”`)
            }}
          />
        </div>
        <select
          value={lang.category_id ?? ''}
          onChange={(e) => {
            const id = e.target.value
            const name = categories.find((c) => c.id === id)?.name
            onUpdate('categoryId', id || null, `categoria → ${name ?? 'sem categoria'}`)
          }}
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
          key={customIcon}
          defaultValue={customIcon}
          aria-label="URL do ícone"
          placeholder="URL do ícone (opcional)"
          className="h-7 text-xs"
          onBlur={(e) => {
            const value = e.target.value.trim()
            if (value !== customIcon) onUpdate('iconUrl', value, value ? 'ícone personalizado' : 'ícone automático')
          }}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="px-1 text-muted-foreground hover:text-destructive"
        aria-label="Remover"
      >
        ×
      </button>
    </Reorder.Item>
  )
}

export function TechnologyReorderList({
  languages,
  categories,
}: {
  languages: Language[]
  categories: LanguageCategory[]
}) {
  const { changes, enqueue } = useChanges()
  const effective = useMemo(() => overlayLanguages(languages, changes), [languages, changes])
  const effectiveCategories = useMemo(() => overlayCategories(categories, changes), [categories, changes])
  const touched = useMemo(() => touchedIds(changes, 'language'), [changes])
  const [order, setOrder] = useState(effective)
  const [prev, setPrev] = useState(effective)

  if (effective !== prev) {
    setPrev(effective)
    setOrder(effective)
  }

  function update(lang: Language, field: LanguageField, value: string | boolean | null, what: string) {
    enqueue({ type: 'language.update', id: lang.id, field, value }, `Tecnologia “${lang.name}”: ${what}`)
  }

  return (
    <Reorder.Group axis="y" values={order} onReorder={setOrder} className="flex max-w-md flex-col gap-2">
      {order.map((lang) => (
        <TechnologyRow
          key={lang.id}
          lang={lang}
          categories={effectiveCategories}
          touched={touched.has(lang.id)}
          onUpdate={(field, value, what) => update(lang, field, value, what)}
          onRemove={() => enqueue({ type: 'language.remove', id: lang.id }, `Tecnologia “${lang.name}”: remover`)}
          onDragEnd={() => enqueue({ type: 'language.order', ids: order.map((l) => l.id) }, 'Tecnologias: nova ordem')}
        />
      ))}
    </Reorder.Group>
  )
}
