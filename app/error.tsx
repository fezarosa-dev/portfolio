'use client'

import { useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import { ErrorScreen } from '@/components/error-screen'
import { Button, buttonVariants } from '@/components/ui/button'

const TEXTS = {
  pt: {
    title: 'Algo quebrou por aqui',
    text: 'O cachorro dormiu em cima do teclado e deu erro. Tenta de novo; se continuar, me avisa pelo contato.',
    retry: 'Tentar de novo',
    home: 'Voltar pro início',
    contact: 'Avisar o Felipe',
  },
  en: {
    title: 'Something broke here',
    text: 'The dog fell asleep on the keyboard and caused an error. Try again; if it keeps happening, let me know through the contact page.',
    retry: 'Try again',
    home: 'Back to home',
    contact: 'Tell Felipe',
  },
} as const

// Erro inesperado em qualquer página (500). Client component: o idioma vem do <html lang>.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const locale = typeof document !== 'undefined' && document.documentElement.lang.startsWith('en') ? 'en' : 'pt'
  const t = TEXTS[locale]

  return (
    <div className="site-warm flex min-h-screen flex-1 flex-col bg-background text-foreground">
      <header className="px-6 py-4">
        <a href={`/${locale}`} className="font-mono text-sm font-medium tracking-tight">
          zanoni<span className="text-signal">.dev.br</span>
        </a>
      </header>
      <ErrorScreen
        code="500"
        title={t.title}
        text={t.text}
        dog="sleeping"
        footer={error.digest && <p className="mt-6 font-mono text-xs text-steel">ref: {error.digest}</p>}
      >
        <Button size="lg" onClick={reset}>
          <RotateCcw className="mr-1 h-4 w-4" />
          {t.retry}
        </Button>
        <a href={`/${locale}`} className={buttonVariants({ size: 'lg', variant: 'outline' })}>
          {t.home}
        </a>
        <a href={`/${locale}/contato?categoria=duvida`} className={buttonVariants({ size: 'lg', variant: 'ghost' })}>
          {t.contact}
        </a>
      </ErrorScreen>
    </div>
  )
}
