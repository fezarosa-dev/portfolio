'use client'

import { toast } from 'sonner'
import type { ReactNode } from 'react'
import { withReindexConfirm } from '@/components/admin/with-reindex-confirm'

export function ToastForm({
  action,
  successMessage,
  errorMessage = 'Não deu pra salvar. Tenta de novo.',
  className,
  confirmReindex = false,
  children,
}: {
  action: (formData: FormData) => Promise<void>
  successMessage: string
  errorMessage?: string
  className?: string
  /** Pergunta antes de salvar se deve atualizar a busca com essa mudança (ver with-reindex-confirm). */
  confirmReindex?: boolean
  children: ReactNode
}) {
  async function handleAction(formData: FormData) {
    try {
      await action(confirmReindex ? withReindexConfirm(formData) : formData)
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
