'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useReduceMotion } from '@/components/reduce-motion-provider'

// Rolagem com inércia (Lenis) no site todo. Continua sendo a rolagem da janela, então useScroll do
// framer-motion, a barra customizada e o sticky seguem funcionando. Fica de fora com "reduzir movimento"
// e em tela de toque (a rolagem nativa do celular já tem inércia). Listas com rolagem própria (busca,
// menus) continuam rolando por dentro (allowNestedScroll).
export function SmoothScroll() {
  const { enabled: reduce } = useReduceMotion()

  useEffect(() => {
    if (reduce || !window.matchMedia('(pointer: fine)').matches) return
    const lenis = new Lenis({ autoRaf: true, anchors: true, allowNestedScroll: true, duration: 1.15 })
    return () => lenis.destroy()
  }, [reduce])

  return null
}
