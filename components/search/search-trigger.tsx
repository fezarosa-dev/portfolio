'use client'

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

export { OPEN_SEARCH_EVENT }
