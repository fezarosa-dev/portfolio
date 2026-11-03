'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { toastError } from '@/lib/toast-error'

export function ReindexSearchButton({
  action,
}: {
  action: () => Promise<{ projects: number; articles: number; languages: number }>
}) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const result = await action()
      toast.success(
        `Reindexado: ${result.projects} projetos, ${result.articles} artigos, ${result.languages} tecnologias.`
      )
    } catch {
      toastError('Não deu pra reindexar. Tenta de novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Reindexando…' : 'Reindexar busca'}
    </Button>
  )
}
