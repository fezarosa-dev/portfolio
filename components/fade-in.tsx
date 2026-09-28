'use client'

import { motion } from 'framer-motion'
import { useReduceMotion } from '@/components/reduce-motion-provider'

export function FadeIn({
  children,
  delay = 0,
  className,
  immediate,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  /** anima ao montar em vez de esperar entrar na tela (páginas curtas que devem carregar inteiras de uma vez) */
  immediate?: boolean
}) {
  const { enabled: reduceMotion } = useReduceMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      {...(immediate
        ? { animate: { opacity: 1, y: 0 } }
        : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 } })}
      transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
