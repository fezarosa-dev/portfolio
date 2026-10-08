'use client'

import { motion } from 'framer-motion'
import { useReduceMotion } from '@/components/reduce-motion-provider'

// template (e não layout) remonta a cada navegação: dá um fade + subida curta ao trocar de página.
export default function Template({ children }: { children: React.ReactNode }) {
  const { enabled } = useReduceMotion()
  return (
    <>
      {!enabled && (
        // filete laranja que varre o topo a cada navegação (o template remonta, então reinicia sozinho)
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-signal"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 0 }}
          transition={{ scaleX: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.3, delay: 0.5 } }}
        />
      )}
      <motion.div
        className="flex flex-1 flex-col"
        initial={enabled ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  )
}
