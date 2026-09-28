'use client'

import { useEffect } from 'react'

const TILT = '[data-tilt]'
const MAGNETIC = '[data-slot="button"]'
const MAX_TILT = 4 // graus
const PULL = 0.2 // fração do deslocamento do mouse até o centro do botão

// Efeitos de hover globais por delegação de eventos (um listener só, sem props nos cards):
//  - [data-tilt]: inclina o card em 3D e acende um brilho onde o mouse está;
//  - botões (data-slot="button"): puxam de leve na direção do mouse.
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
      el.style.removeProperty('--px')
      el.style.removeProperty('--py')
    }

    const move = (e: PointerEvent) => {
      if (root.classList.contains('reduce-motion')) return
      const t = e.target as Element
      const el = (t.closest(MAGNETIC) ?? t.closest(TILT)) as HTMLElement | null
      if (el !== last) {
        reset(last)
        last = el
      }
      if (!el) return
      const b = el.getBoundingClientRect()
      const dx = e.clientX - b.left
      const dy = e.clientY - b.top
      if (el.matches(MAGNETIC)) {
        el.style.setProperty('--px', `${(dx - b.width / 2) * PULL}px`)
        el.style.setProperty('--py', `${(dy - b.height / 2) * PULL}px`)
      } else {
        el.style.setProperty('--ry', `${(dx / b.width - 0.5) * 2 * MAX_TILT}deg`)
        el.style.setProperty('--rx', `${-(dy / b.height - 0.5) * 2 * MAX_TILT}deg`)
        el.style.setProperty('--mx', `${dx}px`)
        el.style.setProperty('--my', `${dy}px`)
      }
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
