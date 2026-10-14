'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { applyChange, savePreviewDraft } from '@/app/admin/(dashboard)/mudancas/actions'
import {
  enqueue as enqueueChange,
  makeChange,
  revoke as revokeChange,
  sendOrder,
  settle,
  type SendResult,
} from '@/lib/changes/queue'
import type { Change, ChangeOp } from '@/lib/changes/types'

const STORAGE_KEY = 'admin-changes-v1'

function load(): Change[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Change[]) : []
  } catch {
    return []
  }
}

function persist(stack: Change[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stack))
  } catch {
    // sem localStorage (modo privado/cheio): a fila segue valendo só nesta aba
  }
}

export type ChangesApi = {
  changes: Change[]
  enqueue: (op: ChangeOp, label: string) => void
  revoke: (id: string) => void
  sendOne: (id: string) => Promise<void>
  sendAll: () => Promise<void>
  sending: boolean
  lastSentAt: number | null
  /** false até a fila ser lida do localStorage (no servidor e no primeiro render) */
  loaded: boolean
}

const ChangesContext = createContext<ChangesApi | null>(null)

export function useChanges(): ChangesApi {
  const ctx = useContext(ChangesContext)
  if (!ctx) throw new Error('useChanges precisa estar dentro de <ChangesProvider>')
  return ctx
}

export function ChangesProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [changes, setChanges] = useState<Change[]>([])
  const [sending, setSending] = useState(false)
  const [lastSentAt, setLastSentAt] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const changesRef = useRef<Change[]>([])
  const sendingRef = useRef(false)

  useEffect(() => {
    // lê depois de montar (o servidor não tem localStorage) e acompanha outras abas do admin
    const initial = load()
    changesRef.current = initial
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChanges(initial)
    setLoaded(true)
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      const next = load()
      changesRef.current = next
      setChanges(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    // o preview do site lê a fila daqui (servidor); sincroniza com um pequeno atraso a cada mudança
    if (!loaded) return
    const timer = setTimeout(() => {
      void savePreviewDraft(changes).catch(() => {})
    }, 700)
    return () => clearTimeout(timer)
  }, [changes, loaded])

  const update = useCallback((fn: (stack: Change[]) => Change[]) => {
    const next = fn(changesRef.current)
    changesRef.current = next
    persist(next)
    setChanges(next)
  }, [])

  const enqueue = useCallback(
    (op: ChangeOp, label: string) =>
      update((stack) => enqueueChange(stack, makeChange(op, label, crypto.randomUUID(), Date.now()))),
    [update]
  )

  const revoke = useCallback((id: string) => update((stack) => revokeChange(stack, id)), [update])

  const send = useCallback(
    async (onlyId?: string) => {
      if (sendingRef.current) return
      sendingRef.current = true
      setSending(true)
      try {
        const targets = sendOrder(changesRef.current).filter((c) => !onlyId || c.id === onlyId)
        const results: SendResult[] = []
        for (const change of targets) {
          const res = await applyChange(change.op)
          results.push({ id: change.id, ok: res.ok, error: res.ok ? undefined : res.error })
        }
        update((stack) => settle(stack, results))
        const okCount = results.filter((r) => r.ok).length
        const failed = results.length - okCount
        if (okCount > 0) {
          setLastSentAt(Date.now())
          router.refresh()
          toast.success(okCount === 1 ? '1 mudança enviada' : `${okCount} mudanças enviadas`)
        }
        if (failed > 0) {
          toast.error(failed === 1 ? '1 mudança falhou — veja na lista' : `${failed} mudanças falharam — veja na lista`)
        }
      } finally {
        sendingRef.current = false
        setSending(false)
      }
    },
    [router, update]
  )

  const sendOne = useCallback((id: string) => send(id), [send])
  const sendAll = useCallback(() => send(), [send])

  const value = useMemo<ChangesApi>(
    () => ({ changes, enqueue, revoke, sendOne, sendAll, sending, lastSentAt, loaded }),
    [changes, enqueue, revoke, sendOne, sendAll, sending, lastSentAt, loaded]
  )

  return <ChangesContext.Provider value={value}>{children}</ChangesContext.Provider>
}
