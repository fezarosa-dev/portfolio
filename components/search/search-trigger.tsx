'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SearchIcon } from 'lucide-react'
import { useReduceMotion } from '@/components/reduce-motion-provider'

const OPEN_SEARCH_EVENT = 'zanoni:open-search'

export function SearchTrigger({ label }: { label: string }) {
  const { enabled: reduceMotion } = useReduceMotion()

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
      aria-label={label}
      title={label}
      className="group flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-hairline text-steel transition-[border-color,color] duration-150 ease-out hover:border-signal hover:text-signal active:scale-90 motion-reduce:transition-none"
    >
      <motion.span
        className="flex"
        whileHover={
          reduceMotion
            ? undefined
            : { rotate: [0, -18, 14, -10, 6, 0], scale: [1, 1.15, 1.1, 1.15, 1.1, 1.15] }
        }
        transition={{ duration: 0.9, ease: 'easeInOut', repeat: Infinity }}
      >
        <SearchIcon className="h-3.5 w-3.5" aria-hidden />
      </motion.span>
    </button>
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
      className={`group h-9 min-w-48 items-center gap-2 rounded-full border border-hairline bg-card/70 px-3 text-sm text-steel shadow-sm transition-[border-color,color,box-shadow] duration-150 ease-out hover:border-signal hover:text-signal hover:shadow-md active:scale-[0.98] motion-reduce:transition-none ${className}`}
    >
      <motion.span
        className="flex"
        whileHover={reduceMotion ? undefined : { rotate: [0, -18, 14, -10, 0], scale: [1, 1.15, 1.1, 1.15, 1] }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      >
        <SearchIcon className="h-4 w-4" aria-hidden />
      </motion.span>
      <span className="flex-1 text-left">{label}</span>
      <kbd className="rounded-md border border-hairline bg-background px-1.5 py-0.5 font-mono text-[10px] text-steel transition-colors group-hover:border-signal group-hover:text-signal">
        {shortcut}
      </kbd>
    </button>
  )
}

export { OPEN_SEARCH_EVENT }
