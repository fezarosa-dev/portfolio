'use client'

import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useReduceMotion } from '@/components/reduce-motion-provider'

type From = 'left' | 'right' | 'up' | 'down' | 'zoom'

// [x, y, rotate, scale] de onde cada peça "voa" até montar no lugar
const START: Record<From, [number, number, number, number]> = {
  left: [-160, 30, -10, 0.9],
  right: [160, 30, 10, 0.9],
  up: [0, 110, 0, 0.92],
  down: [0, -110, 0, 0.92],
  zoom: [0, 40, 0, 0.6],
}

// Montagem guiada pela rolagem: enquanto o elemento sobe pela tela ele voa de `from` até encaixar
// no lugar (opacidade, desfoque, rotação e escala acompanham). Rolou de volta, desmonta.
export function ScrollFly({
  children,
  from = 'up',
  className,
}: {
  children: React.ReactNode
  from?: From
  className?: string
}) {
  const { enabled: reduce } = useReduceMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.6'] })
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 24, mass: 0.4 })
  const [x0, y0, r0, s0] = START[from]

  const x = useTransform(p, [0, 1], [x0, 0])
  const y = useTransform(p, [0, 1], [y0, 0])
  const rotate = useTransform(p, [0, 1], [r0, 0])
  const scale = useTransform(p, [0, 1], [s0, 1])
  const opacity = useTransform(p, [0, 0.7], [0, 1])
  const filter = useTransform(p, [0, 0.8], ['blur(8px)', 'blur(0px)'])

  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div ref={ref} style={{ x, y, rotate, scale, opacity, filter }} className={className}>
      {children}
    </motion.div>
  )
}

// Saída pelo topo: o bloco (ex.: hero) sobe mais devagar que a página, encolhe e esmaece ao rolar.
export function ScrollExit({ children, className }: { children: React.ReactNode; className?: string }) {
  const { enabled: reduce } = useReduceMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 120])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92])
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.15])

  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div ref={ref} style={{ y, scale, opacity }} className={className}>
      {children}
    </motion.div>
  )
}
