'use client'

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { QueueForm } from '@/components/admin/queue-form'
import { useChanges } from '@/components/admin/changes-provider'
import { overlayCompanies, touchedIds } from '@/lib/changes/overlay'
import type { CompanyData } from '@/lib/changes/types'
import type { Company } from '@/lib/supabase/queries'

const dataFrom = (formData: FormData): CompanyData | null => {
  const text = (name: string) => String(formData.get(name) ?? '').trim() || null
  const data = { name: text('name'), name_en: text('name_en'), url: text('url') }
  return data.name || data.name_en ? data : null
}

const labelOf = (c: { name: string | null; name_en: string | null }) => c.name ?? c.name_en ?? 'sem nome'

export function CompaniesAdmin({ companies }: { companies: Company[] }) {
  const { changes, enqueue } = useChanges()
  const list = useMemo(() => overlayCompanies(companies, changes), [companies, changes])
  const touched = useMemo(() => touchedIds(changes, 'company'), [changes])

  return (
    <>
      <QueueForm
        resetOnSubmit
        className="mb-8 flex max-w-sm flex-wrap gap-2"
        onSubmit={(fd) => {
          const data = dataFrom(fd)
          if (data) enqueue({ type: 'company.add', id: crypto.randomUUID(), data }, `Nova empresa “${labelOf(data)}”`)
        }}
      >
        <Input name="name" placeholder="Nome (PT)" />
        <Input name="name_en" placeholder="Nome (EN)" />
        <Input name="url" placeholder="Link (site da empresa...)" />
        <Button type="submit">Adicionar</Button>
      </QueueForm>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma empresa ainda.</p>
      ) : (
        <ul className="flex max-w-md flex-col gap-2">
          {list.map((company) => (
            <li
              key={company.id}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 ${touched.has(company.id) ? 'border-orange-500' : ''}`}
            >
              <QueueForm
                key={`${company.name ?? ''}|${company.name_en ?? ''}|${company.url ?? ''}`}
                className="flex flex-1 flex-wrap gap-2"
                onSubmit={(fd) => {
                  const data = dataFrom(fd)
                  if (data) enqueue({ type: 'company.update', id: company.id, data }, `Empresa “${labelOf(company)}”: editar`)
                }}
              >
                <Input name="name" defaultValue={company.name ?? ''} placeholder="Nome (PT)" className="h-8" />
                <Input name="name_en" defaultValue={company.name_en ?? ''} placeholder="Nome (EN)" className="h-8" />
                <Input name="url" defaultValue={company.url ?? ''} placeholder="Link (site da empresa...)" className="h-8" />
                <Button type="submit" variant="outline" size="sm">
                  Salvar
                </Button>
              </QueueForm>
              <button
                type="button"
                onClick={() => enqueue({ type: 'company.remove', id: company.id }, `Empresa “${labelOf(company)}”: remover`)}
                aria-label="Remover"
                className="px-1 text-muted-foreground hover:text-destructive"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
