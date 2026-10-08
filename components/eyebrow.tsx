'use client'

import { motion } from 'framer-motion'
import { useReduceMotion } from '@/components/reduce-motion-provider'

export function Eyebrow({ children }: { children: React.ReactNode }) {
  const { enabled: reduce } = useReduceMotion()
  return (
    <motion.p
      className="font-mono text-xs tracking-wide text-signal"
      initial={reduce ? false : { opacity: 0, x: -16, clipPath: 'inset(0 100% 0 0)' }}
      animate={{ opacity: 1, x: 0, clipPath: 'inset(0 0% 0 0)' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <span aria-hidden className="text-steel">{'// '}</span>
      {children}
    </motion.p>
  )
}
