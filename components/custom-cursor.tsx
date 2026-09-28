'use client'

import { useEffect, useRef } from 'react'

const INTERACTIVE = 'a, button, [role="button"], summary, label, select, [data-cursor="hover"]'
const TEXT_FIELD = 'input, textarea, [contenteditable="true"]'

// Seta laranja com contorno escuro no lugar do cursor nativo. A ponta da seta
// fica exatamente na posição do mouse; sobre links/botões ela cresce e inclina.
// Só em ponteiro fino (mouse) e sem "reduzir movimento"; senão fica o cursor nativo.
export function CustomCursor() {
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = document.documentElement
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (root.classList.contains('reduce-motion')) return

    root.classList.add('cursor-custom')
    const node = el.current!
    const svg = node.firstElementChild as SVGElement
    let x = -100, y = -100, hover = false, pressed = false

    const draw = () => {
      const s = pressed ? 0.85 : hover ? 1.3 : 1
      node.style.transform = `translate3d(${x}px,${y}px,0)`
      svg.style.transform = `rotate(${hover ? -12 : 0}deg) scale(${s})`
    }
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      const t = e.target as Element | null
      hover = !!t?.closest(INTERACTIVE)
      node.style.opacity = t?.closest(TEXT_FIELD) ? '0' : '1'
      draw()
    }
    const down = () => { pressed = true; draw() }
    const up = () => { pressed = false; draw() }
    const leave = () => { node.style.opacity = '0' }

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
  }, [])

  return (
    <div ref={el} aria-hidden className="cursor-arrow" style={{ opacity: 0 }}>
      <svg width="28" height="28" viewBox="0 0 24 24">
        <path
          d="M4 2.5 L4 19 L8.6 14.9 L11.6 21.5 L14.4 20.3 L11.5 13.8 L17.8 13.4 Z"
          fill="var(--primary)"
          stroke="#12151c"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
