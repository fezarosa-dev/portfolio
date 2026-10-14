'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useChanges } from '@/components/admin/changes-provider'

const CACHE_SECONDS = 60

/** Segundos que faltam pro site público pegar o último envio (cache de 60s). */
function useSecondsLeft(since: number | null): number {
  const [now, setNow] = useState(0)
  useEffect(() => {
    if (!since) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [since])
  if (!since) return 0
  const elapsed = now === 0 ? 0 : Math.floor((now - since) / 1000)
  return Math.max(0, CACHE_SECONDS - elapsed)
}

export function ChangesList() {
  const { changes, sending, sendOne, sendAll, revoke, lastSentAt } = useChanges()
  const secondsLeft = useSecondsLeft(lastSentAt)

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
        <span className="font-mono text-xs text-steel">
          {changes.length > 0 ? `${changes.length} mudança(s) na fila` : 'nenhuma mudança na fila'}
        </span>
        <Button type="button" size="sm" disabled={changes.length === 0 || sending} onClick={() => void sendAll()}>
          {sending ? 'Enviando…' : 'Enviar tudo'}
        </Button>
      </div>

      {secondsLeft > 0 && (
        <p className="mb-4 font-mono text-xs text-steel">
          enviado — no ar em ~{secondsLeft}s (o site público atualiza a cada 60s; &quot;Republicar agora&quot; força na
          hora)
        </p>
      )}

      {changes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          As edições feitas no admin aparecem aqui antes de irem pro site. Envie tudo de uma vez ou revogue o que não
          quiser.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {changes.map((change) => (
            <li
              key={change.id}
              className={`flex items-start justify-between gap-3 rounded-md border bg-background px-3 py-2 ${
                change.status === 'error' ? 'border-destructive' : 'border-orange-500'
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm">{change.label}</p>
                <p className="font-mono text-[11px] text-steel">{new Date(change.ts).toLocaleTimeString('pt-BR')}</p>
                {change.status === 'error' && <p className="mt-1 font-mono text-xs text-destructive">{change.error}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button type="button" size="sm" disabled={sending} onClick={() => void sendOne(change.id)}>
                  Salvar
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={sending} onClick={() => revoke(change.id)}>
                  Revogar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
