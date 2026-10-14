'use client'

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { QueueForm } from '@/components/admin/queue-form'
import { useChanges } from '@/components/admin/changes-provider'
import { overlayAuthors, touchedIds } from '@/lib/changes/overlay'
import type { AuthorData } from '@/lib/changes/types'
import type { Author } from '@/lib/supabase/queries'

const dataFrom = (formData: FormData): AuthorData | null => {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return null
  return { name, url: String(formData.get('url') ?? '').trim() || null }
}

export function AuthorsAdmin({ authors }: { authors: Author[] }) {
  const { changes, enqueue } = useChanges()
  const list = useMemo(() => overlayAuthors(authors, changes), [authors, changes])
  const touched = useMemo(() => touchedIds(changes, 'author'), [changes])

  return (
    <>
      <QueueForm
        resetOnSubmit
        className="mb-8 flex max-w-sm flex-wrap gap-2"
        onSubmit={(fd) => {
          const data = dataFrom(fd)
          if (data) enqueue({ type: 'author.add', id: crypto.randomUUID(), data }, `Novo autor “${data.name}”`)
        }}
      >
        <Input name="name" placeholder="Nome" required />
        <Input name="url" placeholder="Link (LinkedIn, mailto:..., site...)" />
        <Button type="submit">Adicionar</Button>
      </QueueForm>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum autor ainda.</p>
      ) : (
        <ul className="flex max-w-md flex-col gap-2">
          {list.map((author) => (
            <li
              key={author.id}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 ${touched.has(author.id) ? 'border-orange-500' : ''}`}
            >
              <QueueForm
                key={`${author.name}|${author.url ?? ''}`}
                className="flex flex-1 flex-wrap gap-2"
                onSubmit={(fd) => {
                  const data = dataFrom(fd)
                  if (data) enqueue({ type: 'author.update', id: author.id, data }, `Autor “${author.name}”: editar`)
                }}
              >
                <Input name="name" defaultValue={author.name} className="h-8" />
                <Input
                  name="url"
                  defaultValue={author.url ?? ''}
                  placeholder="Link (LinkedIn, mailto:..., site...)"
                  className="h-8"
                />
                <Button type="submit" variant="outline" size="sm">
                  Salvar
                </Button>
              </QueueForm>
              <button
                type="button"
                onClick={() => enqueue({ type: 'author.remove', id: author.id }, `Autor “${author.name}”: remover`)}
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
