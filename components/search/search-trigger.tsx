'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SearchIcon } from 'lucide-react'
import { useReduceMotion } from '@/components/reduce-motion-provider'

const OPEN_SEARCH_EVENT = 'zanoni:open-search'

const SPARKS = [0, 60, 120, 180, 240, 300]

// Lupinha animada: parada ela "varre" em círculo e solta um pulso de vez em quando; no hover ela
// treme, cresce, brilha e solta faíscas; no clique encolhe e estoura de volta.
export function SearchTrigger({ label }: { label: string }) {
  const { enabled: reduceMotion } = useReduceMotion()
  const [hovered, setHovered] = useState(false)
  const animated = !reduceMotion

  return (
    <motion.button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label={label}
      title={label}
      whileHover={animated ? { scale: 1.25 } : undefined}
      whileTap={animated ? { scale: 0.7, rotate: -20 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 12 }}
      className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-steel transition-[border-color,color,background-color,box-shadow] duration-200 hover:border-signal hover:bg-signal/10 hover:text-signal hover:shadow-[0_0_14px_var(--signal)] focus-visible:border-signal focus-visible:text-signal ${hovered ? 'border-signal' : 'border-hairline'}`}
    >
      {animated && (
        <>
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border border-signal"
            animate={{ scale: [1, hovered ? 1.7 : 1.5], opacity: [0.7, 0] }}
            transition={{
              duration: hovered ? 0.9 : 1.4,
              repeat: Infinity,
              repeatDelay: hovered ? 0 : 3.5,
              ease: 'easeOut',
            }}
          />
          {SPARKS.map((angle) => (
            <motion.span
              key={angle}
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal"
              animate={
                hovered
                  ? {
                      x: [0, Math.cos((angle * Math.PI) / 180) * 17],
                      y: [0, Math.sin((angle * Math.PI) / 180) * 17],
                      opacity: [1, 0],
                      scale: [1, 0.2],
                    }
                  : { opacity: 0, x: 0, y: 0 }
              }
              transition={{
                duration: 0.7,
                repeat: hovered ? Infinity : 0,
                ease: 'easeOut',
                delay: (angle / 360) * 0.25,
              }}
            />
          ))}
        </>
      )}
      <motion.span
        className="relative flex"
        animate={
          !animated
            ? undefined
            : hovered
              ? { rotate: [0, -25, 20, -15, 10, 0], x: [0, 1.5, 0, -1.5, 0], y: [0, -1.5, 0, 1.5, 0] }
              : { x: [0, 1.5, 0, -1.5, 0], y: [-1.5, 0, 1.5, 0, -1.5], rotate: 0 }
        }
        transition={
          hovered
            ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <SearchIcon className="h-3.5 w-3.5" aria-hidden />
      </motion.span>
    </motion.button>
  )
}

// Botão de busca em formato de campo, com o atalho à mostra (Ctrl K / ⌘K): a lupinha sozinha
// passava despercebida. Abre o mesmo painel do atalho de teclado.
export function SearchPill({ label, className = '' }: { label: string; className?: string }) {
  const { enabled: reduceMotion } = useReduceMotion()
  const [shortcut, setShortcut] = useState('Ctrl K')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (/mac|iphone|ipad/i.test(navigator.userAgent)) setShortcut('⌘ K')
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
      aria-label={label}
      className={`group h-9 min-w-48 items-center gap-2 rounded-full border border-hairline bg-card/70 px-3 text-sm text-steel shadow-sm transition-[border-color,color,box-shadow] duration-150 ease-out hover:border-signal hover:text-signal hover:shadow-md active:translate-y-0 motion-reduce:transition-none ${className}`}
    >
      <motion.span
        className="flex"
        whileHover={reduceMotion ? undefined : { rotate: [0, -18, 14, -10, 0], scale: [1, 1.15, 1.1, 1.15, 1] }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      >
        <SearchIcon className="h-4 w-4" aria-hidden />
      </motion.span>
      <span className="flex-1 text-left">{label}</span>
      <kbd className="[@media(pointer:coarse)]:hidden rounded-md border border-hairline bg-background px-1.5 py-0.5 font-mono text-[10px] text-steel transition-colors group-hover:border-signal group-hover:text-signal">
        {shortcut}
      </kbd>
    </button>
  )
}

export { OPEN_SEARCH_EVENT }
