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

// Seta laranja no lugar do cursor nativo, com:
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
          style={{ rotate: tilt, transformOrigin: '4px 2.5px' }}
          animate={{ scale: pressed ? 0.82 : hovering ? 1.25 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        >
          <defs>
            <linearGradient id="cursor-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff9a55" />
              <stop offset="1" stopColor="#f2661d" />
            </linearGradient>
          </defs>
          <path
            d="M4 2.5 L4 19 L8.6 14.9 L11.6 21.5 L14.4 20.3 L11.5 13.8 L17.8 13.4 Z"
            fill="url(#cursor-fill)"
            stroke="#12151c"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M5.6 6.2 L5.6 15.4 L8 13.4" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </motion.div>
    </div>
  )
}
