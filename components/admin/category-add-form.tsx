'use client'

import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useChanges } from '@/components/admin/changes-provider'

export function CategoryAddForm() {
  const { enqueue } = useChanges()

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') ?? '').trim()
    if (!name) return
    enqueue(
      { type: 'category.add', id: crypto.randomUUID(), name, nameEn: String(data.get('nameEn') ?? '').trim() },
      `Nova categoria “${name}”`
    )
    toast.success('Na lista de mudanças')
    form.reset()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input name="name" placeholder="Nome (ex: Linguagens)" required />
      <Input name="nameEn" placeholder="Inglês (ex: Languages)" />
      <Button type="submit">Adicionar</Button>
    </form>
  )
}
