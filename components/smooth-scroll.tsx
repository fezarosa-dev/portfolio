'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import { MOBILE_QUERY } from '@/lib/mobile-query'

// Rolagem com inércia (Lenis) em todo o app (site e admin), com a mesma configuração do site da Nortão Cloud
// (duração 1.15, desaceleração exponencial, toque 1.4x), só em desktop (no celular a rolagem é nativa). Continua sendo a rolagem
// da janela, então useScroll do framer-motion, a barra customizada e o sticky seguem funcionando. Só fica de fora
// com "reduzir movimento". Listas com rolagem própria (busca, menus) continuam rolando por dentro.
export function SmoothScroll() {
  const { enabled: reduce } = useReduceMotion()

  useEffect(() => {
    // no celular/toque a rolagem fica nativa, sem inércia
    if (reduce || window.matchMedia(MOBILE_QUERY).matches) return
    const lenis = new Lenis({
      autoRaf: true,
      anchors: true,
      allowNestedScroll: true,
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
    })
    return () => lenis.destroy()
  }, [reduce])

  return null
}
