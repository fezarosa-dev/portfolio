'use client'

import { motion } from 'framer-motion'
import { useReduceMotion } from '@/components/reduce-motion-provider'

const EASE = [0.22, 1, 0.36, 1] as const

// template (e não layout) remonta a cada navegação: o conteúdo sobe com fade e um filete laranja
// varre o topo da tela. Só transform/opacity (rodam na GPU, sem desfoque nem filtro) pra não pesar.
export default function Template({ children }: { children: React.ReactNode }) {
  const { enabled } = useReduceMotion()
  return (
    <>
      {!enabled && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-signal will-change-transform"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 0 }}
          transition={{ scaleX: { duration: 0.55, ease: EASE }, opacity: { duration: 0.25, delay: 0.45 } }}
        />
      )}
      <motion.div
        className="flex flex-1 flex-col"
        initial={enabled ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        {children}
      </motion.div>
    </>
  )
}
