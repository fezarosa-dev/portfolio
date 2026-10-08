'use client'

import { motion } from 'framer-motion'
import { useReduceMotion } from '@/components/reduce-motion-provider'

// template (e não layout) remonta a cada navegação: dá um fade + subida curta ao trocar de página.
export default function Template({ children }: { children: React.ReactNode }) {
  const { enabled } = useReduceMotion()
  return (
    <motion.div
      className="flex flex-1 flex-col"
      initial={enabled ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
