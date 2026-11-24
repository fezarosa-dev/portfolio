'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { cancelFrame, frame } from 'framer-motion'
import 'lenis/dist/lenis.css'
import { useReduceMotion } from '@/components/reduce-motion-provider'

// Rolagem com inércia (Lenis) em todo o app (site e admin), com a mesma configuração do site da Nortão Cloud
// (duração 1.15, desaceleração exponencial), só na roda do mouse/trackpad: o toque fica com a rolagem nativa do
// aparelho (sem inércia extra no celular). Continua sendo a rolagem
// da janela, então useScroll do framer-motion, a barra customizada e o sticky seguem funcionando. Só fica de fora
// com "reduzir movimento". Listas com rolagem própria (busca, menus) continuam rolando por dentro.
export function SmoothScroll() {
  const { enabled: reduce } = useReduceMotion()

  useEffect(() => {
    if (reduce) return
    // o Lenis anda no mesmo relógio do framer-motion, na fase "setup" (antes de o framer ler a rolagem): assim os
    // valores do useScroll usam a posição deste quadro e não a do anterior (sem um quadro de atraso entre a página
    // e os textos/cena presos à rolagem, e sem um segundo laço de requestAnimationFrame)
    const lenis = new Lenis({
      autoRaf: false,
      anchors: true,
      allowNestedScroll: true,
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
    })
    const update = ({ timestamp }: { timestamp: number }) => lenis.raf(timestamp)
    frame.setup(update, true)
    return () => {
      cancelFrame(update)
      lenis.destroy()
    }
  }, [reduce])

  return null
}
