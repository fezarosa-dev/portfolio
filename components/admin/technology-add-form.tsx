'use client'

import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useChanges } from '@/components/admin/changes-provider'

export function TechnologyAddForm() {
  const { enqueue } = useChanges()

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') ?? '').trim()
    if (!name) return
    enqueue(
      {
        type: 'language.add',
        id: crypto.randomUUID(),
        name,
        nameEn: String(data.get('name_en') ?? '').trim(),
        iconUrl: String(data.get('iconUrl') ?? '').trim(),
      },
      `Nova tecnologia “${name}”`
    )
    toast.success('Na lista de mudanças')
    form.reset()
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 flex max-w-sm flex-col gap-2">
      <div className="flex gap-2">
        <Input name="name" placeholder="Nome PT (ex: Python)" required />
        <Input name="name_en" placeholder="Nome EN (opcional)" />
        <Button type="submit">Adicionar</Button>
      </div>
      <Input name="iconUrl" placeholder="URL do ícone (opcional, se não for encontrado)" />
    </form>
  )
}
