'use client'

import { useEffect, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
  AnimatePresence,
} from 'framer-motion'

const INTERACTIVE = 'a, button, [role="button"], summary, label, select, [data-cursor="hover"]'
const TEXT_FIELD = 'input, textarea, [contenteditable="true"]'
type Ripple = { id: number; x: number; y: number }

// Seta clássica (preenchida com a cor de fundo, contorno na cor do texto: inverte no tema escuro) no lugar do cursor nativo, com:
//  - brilho que chega atrasado (spring) e a seta inclinando com a velocidade;
//  - brilho que se expande sobre elementos clicáveis;
//  - onda que se expande a cada clique.
// Só em ponteiro fino (mouse) e sem "reduzir movimento"; senão fica o cursor nativo.
export function CustomCursor() {
  const [active, setActive] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [hidden, setHidden] = useState(true)
  const [pressed, setPressed] = useState(false)
  const [ripples, setRipples] = useState<Ripple[]>([])

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const glowX = useSpring(x, { stiffness: 140, damping: 16, mass: 0.6 })
  const glowY = useSpring(y, { stiffness: 140, damping: 16, mass: 0.6 })
  const tilt = useSpring(useTransform(useVelocity(x), [-2500, 2500], [18, -18], { clamp: true }), {
    stiffness: 200,
    damping: 14,
  })

  useEffect(() => {
    const root = document.documentElement
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (root.classList.contains('reduce-motion')) return

    root.classList.add('cursor-custom')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(true)

    let rid = 0

    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const t = e.target as Element | null
      setHidden(!!t?.closest(TEXT_FIELD))
      setHovering(!!t?.closest(INTERACTIVE))
    }
    const down = (e: PointerEvent) => {
      setPressed(true)
      setRipples((r) => [...r, { id: rid++, x: e.clientX, y: e.clientY }])
    }
    const up = () => setPressed(false)
    const leave = () => setHidden(true)

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.addEventListener('pointerleave', leave)

    return () => {
      root.classList.remove('cursor-custom')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.removeEventListener('pointerleave', leave)
    }
  }, [x, y])

  if (!active) return null

  return (
    <div aria-hidden className="cursor-layer" style={{ opacity: hidden ? 0 : 1 }}>
      {/* brilho atrasado */}
      <motion.div
        className="cursor-glow"
        style={{ x: glowX, y: glowY }}
        animate={{ scale: hovering ? 1.9 : 1, opacity: hovering ? 0.9 : 0.8 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      />

      {/* ondas de clique */}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="cursor-ripple"
            style={{ left: r.x, top: r.y }}
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            onAnimationComplete={() => setRipples((all) => all.filter((a) => a.id !== r.id))}
          />
        ))}
      </AnimatePresence>

      {/* seta */}
      <motion.div className="cursor-arrow" style={{ x, y }}>
        <motion.svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          style={{ rotate: tilt, transformOrigin: '5px 3px' }}
          animate={{ scale: pressed ? 0.82 : hovering ? 1.25 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        >
          <path
            d="M5 3 L5 19.5 L9.3 15.6 L12 21.5 L14.6 20.3 L12 14.6 L17.8 14.6 Z"
            fill="var(--background)"
            stroke="var(--foreground)"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.div>
    </div>
  )
}
