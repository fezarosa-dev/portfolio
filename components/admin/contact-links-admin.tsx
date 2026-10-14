'use client'

import { useMemo, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { QueueForm } from '@/components/admin/queue-form'
import { LanguageToggle } from '@/components/admin/language-toggle'
import { useChanges } from '@/components/admin/changes-provider'
import { overlayContactLinks, touchedIds } from '@/lib/changes/overlay'
import { parseBilingualEn, parseBilingualPt } from '@/lib/bilingual'
import type { ContactLinkData } from '@/lib/changes/types'
import type { ContactLink } from '@/lib/supabase/queries'

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

const dataFrom = (formData: FormData): ContactLinkData | null => {
  const url = String(formData.get('url') ?? '').trim()
  if (!url) return null
  return { label: parseBilingualPt(formData, 'label'), label_en: parseBilingualEn(formData, 'label'), url }
}

const labelOf = (link: { label: string | null; label_en: string | null }) => link.label || link.label_en || 'sem texto'

function ContactRow({
  link,
  language,
  touched,
  onDragEnd,
}: {
  link: ContactLink
  language: 'pt' | 'en'
  touched: boolean
  onDragEnd: () => void
}) {
  const { enqueue } = useChanges()
  const dragControls = useDragControls()

  return (
    <Reorder.Item
      value={link}
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
      <QueueForm
        key={`${link.label ?? ''}|${link.label_en ?? ''}|${link.url}`}
        className="flex flex-1 flex-col gap-1"
        onSubmit={(fd) => {
          const data = dataFrom(fd)
          if (data) enqueue({ type: 'contact.update', id: link.id, data }, `Contato “${labelOf(link)}”: editar`)
        }}
      >
        <div className="flex gap-2">
          <Input
            name="label"
            defaultValue={link.label ?? ''}
            placeholder="Texto (vazio usa o EN)"
            className={`h-8 ${language === 'en' ? 'hidden' : ''}`}
          />
          <Input
            name="label_en"
            defaultValue={link.label_en ?? ''}
            placeholder="Texto em EN (vazio usa o PT)"
            className={`h-8 ${language === 'pt' ? 'hidden' : ''}`}
          />
          <Input name="url" defaultValue={link.url} placeholder="Link" className="h-8" />
          <Button type="submit" variant="outline" size="sm">
            Salvar
          </Button>
        </div>
        <label className={`flex items-center gap-1.5 font-mono text-xs text-steel ${language === 'en' ? 'hidden' : ''}`}>
          <input type="checkbox" name="label_blank" value="true" defaultChecked={link.label === ''} />
          sem texto em PT — não usar o EN no lugar
        </label>
        <label className={`flex items-center gap-1.5 font-mono text-xs text-steel ${language === 'pt' ? 'hidden' : ''}`}>
          <input type="checkbox" name="label_en_blank" value="true" defaultChecked={link.label_en === ''} />
          sem tradução — não usar o PT no lugar
        </label>
      </QueueForm>
      <button
        type="button"
        onClick={() => enqueue({ type: 'contact.remove', id: link.id }, `Contato “${labelOf(link)}”: remover`)}
        aria-label="Remover"
        className="px-1 text-muted-foreground hover:text-destructive"
      >
        ×
      </button>
    </Reorder.Item>
  )
}

export function ContactLinksAdmin({ links }: { links: ContactLink[] }) {
  const { changes, enqueue } = useChanges()
  const effective = useMemo(() => overlayContactLinks(links, changes), [links, changes])
  const touched = useMemo(() => touchedIds(changes, 'contact'), [changes])
  const [order, setOrder] = useState(effective)
  const [prev, setPrev] = useState(effective)
  const [language, setLanguage] = useState<'pt' | 'en'>('pt')

  if (effective !== prev) {
    setPrev(effective)
    setOrder(effective)
  }

  return (
    <>
      <QueueForm
        resetOnSubmit
        className="mt-4 flex max-w-xl gap-2"
        onSubmit={(fd) => {
          const url = String(fd.get('url') ?? '').trim()
          const label = String(fd.get('label') ?? '').trim()
          if (!label || !url) return
          enqueue(
            { type: 'contact.add', id: crypto.randomUUID(), data: { label, label_en: parseBilingualEn(fd, 'label'), url } },
            `Novo contato “${label}”`
          )
        }}
      >
        <Input name="label" placeholder="Texto (ex: E-mail)" required />
        <Input name="url" placeholder="Link (ex: mailto:voce@email.com)" required />
        <Button type="submit">Adicionar</Button>
      </QueueForm>

      <div className="mt-4 flex flex-col gap-3">
        <LanguageToggle language={language} onChange={setLanguage} />
        <Reorder.Group axis="y" values={order} onReorder={setOrder} className="flex max-w-xl flex-col gap-2">
          {order.map((link) => (
            <ContactRow
              key={link.id}
              link={link}
              language={language}
              touched={touched.has(link.id)}
              onDragEnd={() => enqueue({ type: 'contact.order', ids: order.map((l) => l.id) }, 'Contatos: nova ordem')}
            />
          ))}
        </Reorder.Group>
      </div>
    </>
  )
}
