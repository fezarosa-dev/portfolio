'use client'

import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
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
  const [everWoke, setEverWoke] = useState(false)
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
    setEverWoke(true)
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
        className="relative block h-[116px] w-[72px] cursor-pointer"
      >
        {/* folha de 18 quadros (public/img/mascote-acordando.webp): 1º = dormindo, último = sentado.
            Acordar toca a folha pra frente, voltar a dormir toca de trás pra frente (ver .dog-* em globals.css) */}
        <motion.div
          className="absolute inset-0 origin-bottom"
          animate={{ scaleY: acordado || reduceMotion ? 1 : [1, 1.03, 1] }}
          transition={
            acordado || reduceMotion ? { duration: 0.2 } : { duration: 3, ease: 'easeInOut', repeat: Infinity }
          }
        >
          <div
            aria-hidden
            className={`dog-sprite ${
              reduceMotion ? (acordado ? 'dog-awake-static' : '') : acordado ? 'dog-wake' : everWoke ? 'dog-sleep' : ''
            }`}
          />
        </motion.div>
      </motion.button>

      {acordado ? (
        <div className="pointer-events-none absolute right-8 bottom-[108px] w-max max-w-[220px] rounded-2xl border border-hairline bg-card px-2 py-1 font-mono text-[10px] leading-snug break-words text-foreground/80 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.span
              key={frase}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {frase}
            </motion.span>
          </AnimatePresence>
        </div>
      ) : (
        // Zs subindo em zigue-zague da cabeça do cachorro dormindo (CSS: .dog-z em globals.css)
        <div aria-hidden className="pointer-events-none absolute top-[52px] left-5 font-mono font-semibold text-signal">
          {reduceMotion ? (
            <span className="absolute text-base opacity-60">Z</span>
          ) : (
            [0, 1, 2, 3].map((i) => (
              <span key={i} className="dog-z" style={{ animationDelay: `${i * 0.6}s` }}>
                Z
              </span>
            ))
          )}
        </div>
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
