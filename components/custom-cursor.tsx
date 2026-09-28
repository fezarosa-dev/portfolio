'use client'

import { useEffect, useRef } from 'react'

const INTERACTIVE = 'a, button, [role="button"], summary, label, select, [data-cursor="hover"]'
const TEXT_FIELD = 'input, textarea, [contenteditable="true"]'

// Ponto laranja que segue o mouse na hora + anel que chega atrasado (lerp).
// Só em ponteiro fino (mouse) e sem "reduzir movimento"; senão fica o cursor nativo.
export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = document.documentElement
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (root.classList.contains('reduce-motion')) return

    root.classList.add('cursor-custom')
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0
    let scale = 1, pressed = false

    const draw = () => {
      rx += (x - rx) * 0.18
      ry += (y - ry) * 0.18
      dot.current!.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${pressed ? 0.6 : 1})`
      ring.current!.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%) scale(${pressed ? scale * 0.85 : scale})`
      raf = requestAnimationFrame(draw)
    }

    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      const t = e.target as Element | null
      const text = !!t?.closest(TEXT_FIELD)
      scale = t?.closest(INTERACTIVE) ? 1.8 : 1
      dot.current!.style.opacity = ring.current!.style.opacity = text ? '0' : '1'
      ring.current!.dataset.hover = scale > 1 ? 'true' : 'false'
    }
    const down = () => (pressed = true)
    const up = () => (pressed = false)
    const leave = () => {
      dot.current!.style.opacity = ring.current!.style.opacity = '0'
    }

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.addEventListener('pointerleave', leave)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      root.classList.remove('cursor-custom')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <>
      <div ref={ring} aria-hidden className="cursor-ring" style={{ opacity: 0 }} />
      <div ref={dot} aria-hidden className="cursor-dot" style={{ opacity: 0 }} />
    </>
  )
}
