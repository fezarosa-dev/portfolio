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

// Seta arredondada (formato de public/img/cursor.png; preenchida com a cor do texto e contorno na cor de fundo, inverte no tema escuro) no lugar do cursor nativo, com:
//  - a seta inclinando com a velocidade;
//  - onda que se expande a cada clique.
// Só em ponteiro fino (mouse) e sem "reduzir movimento"; senão fica o cursor nativo.
export function CustomCursor() {
  const [active, setActive] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [hidden, setHidden] = useState(true)
  const [text, setText] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [ripples, setRipples] = useState<Ripple[]>([])

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
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
      setHidden(false)
      setText(!!t?.closest(TEXT_FIELD))
      setHovering(!!t?.closest(INTERACTIVE))
    }
    const down = (e: PointerEvent) => {
      setPressed(true)
      setRipples((r) => [...r, { id: rid++, x: e.clientX, y: e.clientY }])
    }
    const up = () => setPressed(false)
    const leave = (e: MouseEvent) => {
      if (!e.relatedTarget) setHidden(true)
    }

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.addEventListener('mouseout', leave)

    return () => {
      root.classList.remove('cursor-custom')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.removeEventListener('mouseout', leave)
    }
  }, [x, y])

  if (!active) return null

  return (
    <div aria-hidden className="cursor-layer" style={{ opacity: hidden ? 0 : 1 }}>
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
          width="20"
          height="20"
          viewBox="0 0 512 512"
          style={{ rotate: tilt, transformOrigin: '5px 2.5px' }}
          animate={{ scale: text ? 0 : pressed ? 0.82 : hovering ? 1.25 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        >
          <path
            d="M130 105 Q130 65 172 65 Q188 65 202 76 L432 262 Q448 276 446 296 Q440 334 410 334 L322 334 Q290 334 268 362 L212 428 Q195 448 172 447 Q140 445 140 405 Z"
            fill="var(--foreground)"
            stroke="var(--background)"
            strokeWidth="26"
            paintOrder="stroke"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.div>

      {/* cursor de texto (I-beam arredondado, mesmo estilo da seta) sobre campos de escrita */}
      <motion.div className="cursor-arrow" style={{ x, y }}>
        <motion.svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          style={{ marginLeft: -6, marginTop: -8.5 }}
          initial={false}
          animate={{ scale: text ? (pressed ? 0.85 : 1) : 0, opacity: text ? [1, 0.55, 1] : 0 }}
          transition={{
            scale: { type: 'spring', stiffness: 500, damping: 18 },
            opacity: text ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.1 },
          }}
        >
          <path d="M8.5 4 H15.5 M12 4 V20 M8.5 20 H15.5" fill="none" stroke="var(--background)" strokeWidth="6" strokeLinecap="round" />
          <path d="M8.5 4 H15.5 M12 4 V20 M8.5 20 H15.5" fill="none" stroke="var(--foreground)" strokeWidth="2.6" strokeLinecap="round" />
        </motion.svg>
      </motion.div>
    </div>
  )
}
