'use client'

import { useEffect } from 'react'

const TILT = '[data-tilt]'
const MAX_TILT = 4 // graus

// Efeitos de hover globais por delegação de eventos (um listener só, sem props nos cards):
//  - [data-tilt]: inclina o card em 3D e acende um brilho onde o mouse está.
// Só em ponteiro fino e sem "reduzir movimento".
export function HoverEffects() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const root = document.documentElement
    let last: HTMLElement | null = null

    const reset = (el: HTMLElement | null) => {
      if (!el) return
      el.style.removeProperty('--rx')
      el.style.removeProperty('--ry')
      el.style.removeProperty('--mx')
      el.style.removeProperty('--my')
    }

    const move = (e: PointerEvent) => {
      if (root.classList.contains('reduce-motion')) return
      const t = e.target as Element
      const el = t.closest(TILT) as HTMLElement | null
      if (el !== last) {
        reset(last)
        last = el
      }
      if (!el) return
      const b = el.getBoundingClientRect()
      const dx = e.clientX - b.left
      const dy = e.clientY - b.top
      el.style.setProperty('--ry', `${(dx / b.width - 0.5) * 2 * MAX_TILT}deg`)
      el.style.setProperty('--rx', `${-(dy / b.height - 0.5) * 2 * MAX_TILT}deg`)
      el.style.setProperty('--mx', `${dx}px`)
      el.style.setProperty('--my', `${dy}px`)
    }
    const leave = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        reset(last)
        last = null
      }
    }

    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('mouseout', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('mouseout', leave)
      reset(last)
    }
  }, [])

  return null
}
