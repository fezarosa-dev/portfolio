'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { useReduceMotion } from '@/components/reduce-motion-provider'

// estrelas de cada camada: posições fixas (sem aleatório no render), cada camada anda num ritmo com a rolagem
const LAYERS = [
  { speed: -60, size: 1, alpha: 0.35, stars: [[8, 12], [22, 40], [37, 8], [51, 66], [64, 22], [78, 54], [91, 14], [15, 78], [44, 90], [70, 84], [86, 36], [30, 58]] },
  { speed: -140, size: 1.5, alpha: 0.55, stars: [[12, 28], [33, 18], [58, 44], [81, 70], [6, 62], [47, 30], [68, 10], [93, 48], [25, 86]] },
  { speed: -240, size: 2, alpha: 0.8, stars: [[18, 52], [42, 74], [74, 26], [88, 88], [55, 6]] },
]

// o globo (public/img/globo-brasil.svg) é desenhado num quadro de 2000 x 2000; Alcântara (MA), a base de
// lançamento brasileira, cai neste ponto dele (calculado na mesma projeção que gerou o SVG)
const BOX = 2000
const BASE = { x: 1132, y: 97 }
// o globo começa 160 px abaixo do topo da seção (top-40)
const GLOBE_TOP = 160

/**
 * O espaço onde o foguete chegou: a Terra em contornos com o Brasil no meio, estrelas com parallax e a trajetória
 * do lançamento saindo de Alcântara até a chama do foguete da cena de cima. Só decoração (aria-hidden).
 */
export function ContactSpace({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const { enabled: reduce } = useReduceMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  // a trajetória se desenha da base para cima (o foguete saindo do Brasil) quando a seção entra na tela
  const launch = useTransform(scrollYProgress, [0.02, 0.22], [reduce ? 1 : 0, 1])
  const y = LAYERS.map((l) => useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : l.speed])) // eslint-disable-line react-hooks/rules-of-hooks
  // ponta de cima da trajetória: onde a chama do foguete cai na tela (--rocket-x, publicado pela cena 3D), no topo
  const near = useInView(ref, { margin: '300px 0px' })
  const [top, setTop] = useState({ x: 0.61 * BOX, y: -GLOBE_TOP })
  useEffect(() => {
    if (!near) return
    const measure = () => {
      const w = ref.current?.clientWidth || window.innerWidth
      const rocket = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rocket-x')) || 61
      const next = { x: (rocket / 100) * BOX, y: (-GLOBE_TOP * BOX) / w }
      setTop((cur) => (Math.abs(cur.x - next.x) < 1 && Math.abs(cur.y - next.y) < 1 ? cur : next))
    }
    // a cena atualiza --rocket-x enquanto o foguete sobe: relê ao rolar e ao mudar o tamanho da tela
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
    }
  }, [near])
  // sobe reto saindo da base e vai inclinando até a chama (a curva de um lançamento de verdade)
  const trajectory = `M ${BASE.x} ${BASE.y} C ${BASE.x} ${BASE.y - 140}, ${top.x} ${top.y + 260}, ${top.x} ${top.y}`

  return (
    <div ref={ref} className="scene-night relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {LAYERS.map((layer, i) => (
          <motion.div key={i} className="absolute inset-0" style={{ y: y[i] }}>
            {layer.stars.map(([x, t]) => (
              <span
                key={`${x}-${t}`}
                className="absolute rounded-full bg-[#f6eae3]"
                style={{ left: `${x}%`, top: `${t}%`, width: layer.size, height: layer.size, opacity: layer.alpha }}
              />
            ))}
          </motion.div>
        ))}
        {/* a Terra vista do espaço, só em contornos no laranja do site, com o Brasil no meio (SVG gerado de dados
            abertos do Natural Earth, sem imagem) */}
        <div className="absolute inset-x-0 top-40 rounded-full shadow-[0_-30px_120px_-20px_rgba(242,102,29,0.45)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático decorativo, o otimizador de imagem não ajuda */}
          <img src="/img/globo-brasil.svg" alt="" width={BOX} height={BOX} loading="lazy" decoding="async" className="h-auto w-full" />
          {/* trajetória do lançamento, no mesmo quadro do globo (para cair certinho em Alcântara) */}
          <svg viewBox={`0 0 ${BOX} ${BOX}`} className="absolute inset-0 h-full w-full overflow-visible" fill="none">
            <defs>
              <linearGradient id="launch-trail" gradientUnits="userSpaceOnUse" x1="0" y1={top.y} x2="0" y2={BASE.y}>
                <stop offset="0%" stopColor="#f2661d" />
                <stop offset="100%" stopColor="#f6eae3" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <motion.path d={trajectory} stroke="#f2661d" strokeOpacity={0.25} strokeWidth={10} strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ pathLength: launch }} />
            <motion.path d={trajectory} stroke="url(#launch-trail)" strokeWidth={1.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ pathLength: launch }} />
          </svg>
          {/* a base: ponto aceso pulsando e o nome */}
          <div className="absolute" style={{ left: `${(BASE.x / BOX) * 100}%`, top: `${(BASE.y / BOX) * 100}%` }}>
            <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-[#f2661d] shadow-[0_0_12px_rgba(242,102,29,0.9)]" />
            <span className="absolute -left-1.5 -top-1.5 h-3 w-3 animate-ping rounded-full bg-[#f2661d]/60 motion-reduce:animate-none" />
            <span className="absolute left-4 top-1 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] text-[#f6eae3]/80">
              Alcântara · MA
            </span>
          </div>
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}
