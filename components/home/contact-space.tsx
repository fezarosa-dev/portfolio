'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useReduceMotion } from '@/components/reduce-motion-provider'

// estrelas de cada camada: posições fixas (sem aleatório no render), cada camada anda num ritmo com a rolagem
const LAYERS = [
  { speed: -60, size: 1, alpha: 0.35, stars: [[8, 12], [22, 40], [37, 8], [51, 66], [64, 22], [78, 54], [91, 14], [15, 78], [44, 90], [70, 84], [86, 36], [30, 58]] },
  { speed: -140, size: 1.5, alpha: 0.55, stars: [[12, 28], [33, 18], [58, 44], [81, 70], [6, 62], [47, 30], [68, 10], [93, 48], [25, 86]] },
  { speed: -240, size: 2, alpha: 0.8, stars: [[18, 52], [42, 74], [74, 26], [88, 88], [55, 6]] },
]

/**
 * O espaço onde o foguete chegou: rastro aceso descendo do topo (vem da chama da cena de cima), horizonte de um
 * planeta e estrelas em camadas com parallax. Só decoração (aria-hidden); com "reduzir movimento" fica parado.
 */
export function ContactSpace({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const { enabled: reduce } = useReduceMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const trail = useTransform(scrollYProgress, [0, 0.35], [1, 0.15])
  const horizon = useTransform(scrollYProgress, [0, 0.4], [80, 0])
  const y = LAYERS.map((l) => useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : l.speed])) // eslint-disable-line react-hooks/rules-of-hooks
  return (
    <div ref={ref} className="scene-night relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {LAYERS.map((layer, i) => (
          <motion.div key={i} className="absolute inset-0" style={{ y: y[i] }}>
            {layer.stars.map(([x, top]) => (
              <span
                key={`${x}-${top}`}
                className="absolute rounded-full bg-[#f6eae3]"
                style={{ left: `${x}%`, top: `${top}%`, width: layer.size, height: layer.size, opacity: layer.alpha }}
              />
            ))}
          </motion.div>
        ))}
        {/* rastro do foguete: continua a chama da cena de cima, saindo do meio do bocal */}
        <motion.div
          className="absolute top-0 h-72 w-px -translate-x-1/2 bg-gradient-to-b from-[#f2661d] via-[#b0775a]/60 to-transparent"
          // --rocket-x vem da cena 3D (onde a ponta da chama do foguete cai na tela); sem ela, o lugar de costume
          style={{ opacity: trail, left: 'var(--rocket-x, 61%)' }}
        />
        {/* a Terra vista do espaço, só em contornos no laranja do site, com o Brasil no meio (SVG gerado de dados
            abertos do Natural Earth, sem imagem). Sobe devagar com a rolagem */}
        <motion.div
          className="absolute left-1/2 top-40 w-[120vw] -translate-x-1/2 rounded-full shadow-[0_-30px_120px_-20px_rgba(242,102,29,0.45)]"
          style={{ y: reduce ? 0 : horizon }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático decorativo, o otimizador de imagem não ajuda */}
          <img src="/img/globo-brasil.svg" alt="" width={2000} height={2000} loading="lazy" decoding="async" className="h-auto w-full" />
        </motion.div>
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}
