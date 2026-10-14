'use client'

import type { FormEvent, ReactNode } from 'react'
import { toast } from 'sonner'

/** Formulário do admin que, em vez de gravar, entrega o FormData pra quem enfileira a mudança. */
export function QueueForm({
  onSubmit,
  resetOnSubmit = false,
  message = 'Na lista de mudanças',
  className,
  children,
}: {
  onSubmit: (formData: FormData) => void
  resetOnSubmit?: boolean
  message?: string
  className?: string
  children: ReactNode
}) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    onSubmit(new FormData(form))
    toast.success(message)
    if (resetOnSubmit) form.reset()
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  )
}
