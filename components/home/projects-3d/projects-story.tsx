'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { motion, transform, useInView, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import { ProjectsTeaser } from '@/components/home/projects-teaser'
import type { Locale } from '@/lib/i18n'

// o 3D (three + react-three-fiber) vira um pacote à parte, baixado só quando esta seção vai ser mostrada
const PcScene = dynamic(() => import('./pc-scene'), { ssr: false })

type Stats = { projects: number; technologies: number; companies: number }

type TeaserProps = React.ComponentProps<typeof ProjectsTeaser>

// o PC é metáfora de uma solução de software (não de trabalho com hardware): os textos deixam isso claro
const CHAPTERS: { at: number; pt: [string, string]; en: [string, string] }[] = [
  { at: 0, pt: ['Como uma solução nasce', 'Todo sistema é um conjunto de peças que precisam funcionar juntas.'], en: ['How a solution comes together', 'Every system is a set of parts that have to work together.'] },
  { at: 0.16, pt: ['Peça por peça', 'A base não é o código, é a arquitetura da solução. O código é o caminho.'], en: ['Piece by piece', "The foundation isn't the code, it's the solution architecture. Code is how you get there."] },
  { at: 0.46, pt: ['O núcleo', 'No centro de tudo, o que já foi entregue.'], en: ['The core', "At the center of it all, what's already been delivered."] },
  { at: 0.94, pt: ['Os projetos', 'Em breve: os servidores sobem do chão com cada projeto.'], en: ['The projects', 'Coming soon: servers rise from the ground with each project.'] },
]

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

const noopSubscribe = () => () => {}

// número que sobe junto com o mergulho (0 → total) e fica parado no fim
function Counter({ progress, value, label }: { progress: MotionValue<number>; value: number; label: string }) {
  const shown = useTransform(progress, (v) => Math.round(transform(v, [0.5, 0.8], [0, value])))
  return (
    <div>
      <motion.p className="font-display text-4xl font-medium tabular-nums text-signal sm:text-5xl">{shown}</motion.p>
      <p className="font-mono text-[11px] uppercase tracking-wide text-steel">{label}</p>
    </div>
  )
}

function ChapterText({
  progress,
  index,
  locale,
  stats,
}: {
  progress: MotionValue<number>
  index: number
  locale: Locale
  stats: Stats
}) {
  // o primeiro capítulo já começa visível e o último fica até o fim. A conversão é por função (e não pelos
  // arrays direto): assim o framer não joga a animação na API nativa do navegador, que mede a rolagem da
  // página inteira em vez da desta seção
  const start = CHAPTERS[index].at
  const next = CHAPTERS[index + 1]?.at
  const input = [
    ...(index === 0 ? [0] : [start - 0.01, start + 0.04]),
    ...(next === undefined ? [1] : [next - 0.05, next - 0.015]),
  ]
  const fade = [...(index === 0 ? [1] : [0, 1]), ...(next === undefined ? [1] : [1, 0])]
  const slide = [...(index === 0 ? [0] : [40, 0]), ...(next === undefined ? [0] : [0, -40])]
  const opacity = useTransform(progress, (v) => transform(v, input, fade))
  const y = useTransform(progress, (v) => transform(v, input, slide))
  const [title, text] = CHAPTERS[index][locale === 'en' ? 'en' : 'pt']
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0 top-0">
      <h2 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">{title}</h2>
      <p className="mt-3 max-w-sm text-steel">{text}</p>
      {index === 2 && (
        <div className="mt-6 flex gap-8">
          <Counter progress={progress} value={stats.projects} label={locale === 'en' ? 'projects' : 'projetos'} />
          <Counter progress={progress} value={stats.technologies} label={locale === 'en' ? 'technologies' : 'tecnologias'} />
          <Counter progress={progress} value={stats.companies} label={locale === 'en' ? 'companies' : 'empresas'} />
        </div>
      )}
    </motion.div>
  )
}

function Story({ eyebrow, locale, stats }: { eyebrow: string; locale: Locale; stats: Stats }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const near = useInView(ref, { margin: '400px 0px' })
  const [chapter, setChapter] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const current = CHAPTERS.reduce((acc, c, i) => (p >= c.at - 0.02 ? i : acc), 0)
    if (current !== chapter) setChapter(current)
  })

  return (
    <section ref={ref} className="relative border-t border-hairline" style={{ height: '480vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0">{near && <PcScene progress={scrollYProgress} active={near} stats={stats} en={locale === 'en'} />}</div>
        {/* degradê para o texto ficar legível sobre a cena */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-transparent sm:bg-gradient-to-r sm:from-background/90 sm:via-background/20" />
        <div className="pointer-events-none relative mx-auto flex h-full max-w-6xl px-6 pt-24 sm:items-center sm:pt-0">
          <div className="relative w-full max-w-md">
            <p className="font-mono text-xs tracking-wide text-signal">{'// '}{eyebrow}</p>
            <div className="relative mt-3 h-64">
              {CHAPTERS.map((_, i) => (
                <ChapterText key={i} progress={scrollYProgress} index={i} locale={locale} stats={stats} />
              ))}
            </div>
          </div>
        </div>
        <ol className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 font-mono text-[11px] sm:flex">
          {CHAPTERS.map((c, i) => (
            <li key={i} className={`flex items-center justify-end gap-2 transition-colors ${i === chapter ? 'text-foreground' : 'text-steel/60'}`}>
              {i === chapter && <span>{c[locale === 'en' ? 'en' : 'pt'][0]}</span>}
              <span>{String(i + 1).padStart(2, '0')}</span>
              <span className={`h-px transition-all ${i === chapter ? 'w-8 bg-signal' : 'w-3 bg-steel/50'}`} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function ProjectsStory({ stats, ...teaser }: TeaserProps & { stats: Stats }) {
  const { enabled: reduce } = useReduceMotion()
  const webgl = useSyncExternalStore(noopSubscribe, supportsWebGL, () => false)
  return (
    <>
      {!reduce && webgl && <Story eyebrow={teaser.eyebrow} locale={teaser.locale} stats={stats} />}
      <ProjectsTeaser {...teaser} />
    </>
  )
}
