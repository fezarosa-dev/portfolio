'use client'

import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import { RickrollPlayer } from '@/components/rickroll-player'

const JOKE_API_URL = 'https://api.chucknorris.io/jokes/random?category=dev'
const FRASES_FALLBACK = ['Au au!', '$ pet dog.exe', 'zzz... quem chamou?', 'café ☕ pra acordar']
const RICKROLL_WINDOW_MS = 900

export function Mascote({
  ativo,
  rickrollVideoId,
  rickrollClicks = 3,
}: {
  ativo: boolean
  rickrollVideoId: string | null
  rickrollClicks?: number
}) {
  const [acordado, setAcordado] = useState(false)
  const [frase, setFrase] = useState('...')
  const [rickrollOpen, setRickrollOpen] = useState(false)
  const [rickrollPreload, setRickrollPreload] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)
  const clickTimestampsRef = useRef<number[]>([])
  const rickrollVideoRef = useRef<HTMLVideoElement>(null)
  const { enabled: reduceMotion } = useReduceMotion()

  if (!ativo) return null

  function acordar() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    const requestId = ++requestIdRef.current
    setFrase('...')
    setAcordado(true)
    timeoutRef.current = setTimeout(() => setAcordado(false), 6000)

    fetch(JOKE_API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (requestId !== requestIdRef.current) return
        if (typeof data.value !== 'string') throw new Error('sem piada')
        setFrase(data.value.length > 140 ? `${data.value.slice(0, 140)}…` : data.value)
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return
        setFrase(FRASES_FALLBACK[Math.floor(Math.random() * FRASES_FALLBACK.length)])
      })
  }

  function handleClick() {
    acordar()
    if (!rickrollVideoId) return

    if (!rickrollPreload) {
      // já no 1º clique deixa o <video> montado (escondido) com preload="auto",
      // pra começar a bufferizar antes da pessoa completar os 3 cliques
      flushSync(() => setRickrollPreload(true))
    }

    const now = Date.now()
    const recent = clickTimestampsRef.current.filter((t) => now - t < RICKROLL_WINDOW_MS)
    recent.push(now)
    clickTimestampsRef.current = recent

    if (recent.length >= rickrollClicks) {
      clickTimestampsRef.current = []
      // o play() precisa rodar dentro do mesmo clique pro navegador liberar som
      setRickrollOpen(true)
      rickrollVideoRef.current?.play().catch(() => {})
    }
  }

  function fecharRickroll() {
    setRickrollOpen(false)
    const video = rickrollVideoRef.current
    if (video) {
      video.pause()
      video.currentTime = 0
    }
  }

  return (
    <div className="fixed bottom-0 right-4 z-30 !w-fit origin-bottom-right scale-75 select-none sm:bottom-4 sm:scale-100">
      <motion.button
        type="button"
        onClick={handleClick}
        aria-label="Cutucar o mascote"
        animate={
          reduceMotion
            ? { rotate: 0, y: 0 }
            : acordado
              ? { rotate: [0, -8, 8, -5, 5, 0], y: 0 }
              : { y: [0, -4, 0], rotate: 0 }
        }
        transition={
          reduceMotion
            ? undefined
            : acordado
              ? { duration: 0.5, ease: 'easeInOut' }
              : { duration: 2.2, ease: 'easeInOut', repeat: Infinity }
        }
        className="block cursor-pointer"
      >
        <Image
          src={acordado ? '/img/mascote-cachorro-acordado.svg' : '/img/mascote-cachorro.svg'}
          alt=""
          aria-hidden
          width={64}
          height={116}
          priority
          className="!h-[116px] !w-16"
        />
      </motion.button>

      <div className="pointer-events-none absolute right-8 bottom-[108px] w-max max-w-[220px] rounded-2xl border border-hairline bg-card px-2 py-1 font-mono text-[10px] leading-snug break-words text-foreground/80 shadow-sm">
        <AnimatePresence mode="wait">
          {acordado ? (
            <motion.span
              key={frase}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {frase}
            </motion.span>
          ) : (
            <motion.span key="zzz" className="inline-flex gap-0.5" aria-hidden>
              {['Z', 'z', 'z'].map((letra, i) => (
                <motion.span
                  key={i}
                  animate={
                    reduceMotion
                      ? undefined
                      : { y: [0, -4, 0], opacity: [0.4, 1, 0.4] }
                  }
                  transition={
                    reduceMotion
                      ? undefined
                      : { duration: 1.4, ease: 'easeInOut', repeat: Infinity, delay: i * 0.25 }
                  }
                >
                  {letra}
                </motion.span>
              ))}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {!acordado && (
        <>
          <motion.span
            aria-hidden
            className="pointer-events-none absolute top-6 right-9 h-2 w-2 rounded-full border border-hairline bg-card"
            animate={reduceMotion ? undefined : { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
            transition={reduceMotion ? undefined : { duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
          />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute top-4 right-7 h-1.5 w-1.5 rounded-full border border-hairline bg-card"
            animate={reduceMotion ? undefined : { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
            transition={
              reduceMotion ? undefined : { duration: 1.8, ease: 'easeInOut', repeat: Infinity, delay: 0.3 }
            }
          />
        </>
      )}

      {rickrollVideoId && rickrollPreload && (
        <RickrollPlayer
          ref={rickrollVideoRef}
          videoUrl={`/api/drive-video/${rickrollVideoId}`}
          open={rickrollOpen}
          onClose={fecharRickroll}
        />
      )}
    </div>
  )
}
