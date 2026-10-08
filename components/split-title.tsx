'use client'

import { motion } from 'framer-motion'
import { useReduceMotion } from '@/components/reduce-motion-provider'

// Título que sobe palavra por palavra de dentro de uma máscara (reveal em cascata).
export function SplitTitle({ text }: { text: string }) {
  const { enabled: reduce } = useReduceMotion()
  if (reduce) return <>{text}</>
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.split(' ').map((word, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: '110%', rotate: 4 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
              {i < text.split(' ').length - 1 ? ' ' : ''}
            </motion.span>
          </span>
        ))}
      </span>
    </>
  )
}
