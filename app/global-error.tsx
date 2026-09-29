'use client'

import './globals.css'

// Último recurso: erro no próprio layout raiz (substitui <html>). Sem fontes nem componentes do site,
// só o CSS global e o tema escuro padrão.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR" className="dark h-full antialiased">
      <body className="site-warm flex min-h-full flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
        <p className="text-8xl font-bold text-signal">500</p>
        <h1 className="text-2xl font-medium">Algo quebrou por aqui</h1>
        <p className="max-w-md text-steel">O site teve um problema sério. Tenta de novo em instantes.</p>
        {error.digest && <p className="font-mono text-xs text-steel">ref: {error.digest}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Tentar de novo
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- sem contexto do Next aqui, precisa de <a> */}
          <a href="/" className="rounded-lg border border-border px-4 py-2 text-sm font-medium">
            Voltar pro início
          </a>
        </div>
      </body>
    </html>
  )
}
