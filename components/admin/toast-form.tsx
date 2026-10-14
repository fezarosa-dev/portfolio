'use client'

import { toast } from 'sonner'
import type { ReactNode } from 'react'

export function ToastForm({
  action,
  successMessage,
  errorMessage = 'Não deu pra salvar. Tenta de novo.',
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>
  successMessage: string
  errorMessage?: string
  className?: string
  children: ReactNode
}) {
  async function handleAction(formData: FormData) {
    try {
      await action(formData)
      toast.success(successMessage)
    } catch (err) {
      toast.error(errorMessage)
      throw err
    }
  }

  return (
    <form action={handleAction} className={className}>
      {children}
    </form>
  )
}
