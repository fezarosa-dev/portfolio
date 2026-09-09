'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { republishSite } from '@/app/admin/actions'

export function RepublishButton() {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await republishSite()
          toast.success('Site republicado', {
            description: 'As mudanças já estão no ar pra todos os visitantes.',
          })
        })
      }
    >
      {pending ? 'Republicando…' : 'Republicar agora'}
    </Button>
  )
}
