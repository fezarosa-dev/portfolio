'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { motion, transform, useInView, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import { ProjectsTeaser } from '@/components/home/projects-teaser'
import type { Locale } from '@/lib/i18n'

// o 3D (three + react-three-fiber) vira um pacote à parte, baixado só quando esta seção vai ser mostrada
const PcScene = dynamic(() => import('./pc-scene'), { ssr: false })

type TeaserProps = React.ComponentProps<typeof ProjectsTeaser>

const CHAPTERS: { at: number; pt: [string, string]; en: [string, string] }[] = [
  { at: 0, pt: ['O hardware', 'Por trás de cada projeto, uma máquina montada com cuidado.'], en: ['The hardware', 'Behind every project, a carefully built machine.'] },
  { at: 0.3, pt: ['Peça por peça', 'Desmontando a stack: cada componente, uma tecnologia que eu uso.'], en: ['Piece by piece', 'Taking the stack apart: every component, a technology I use.'] },
  { at: 0.72, pt: ['O núcleo', 'Em breve: a câmera mergulha no processador.'], en: ['The core', 'Coming soon: the camera dives into the processor.'] },
  { at: 0.88, pt: ['Os projetos', 'Em breve: os servidores sobem do chão com cada projeto.'], en: ['The projects', 'Coming soon: servers rise from the ground with each project.'] },
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

function ChapterText({ progress, index, locale }: { progress: MotionValue<number>; index: number; locale: Locale }) {
  // o primeiro capítulo já começa visível e o último fica até o fim. A conversão é por função (e não pelos
  // arrays direto): assim o framer não joga a animação na API nativa do navegador, que mede a rolagem da
  // página inteira em vez da desta seção
  const start = CHAPTERS[index].at
  const next = CHAPTERS[index + 1]?.at
  const input = [
    ...(index === 0 ? [0] : [start - 0.05, start + 0.02]),
    ...(next === undefined ? [1] : [next - 0.06, next - 0.01]),
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
    </motion.div>
  )
}

function Story({ labels, eyebrow, locale }: { labels: string[]; eyebrow: string; locale: Locale }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const near = useInView(ref, { margin: '400px 0px' })
  const [chapter, setChapter] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const current = CHAPTERS.reduce((acc, c, i) => (p >= c.at - 0.02 ? i : acc), 0)
    if (current !== chapter) setChapter(current)
  })

  return (
    <section ref={ref} className="relative border-t border-hairline" style={{ height: '320vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0">{near && <PcScene progress={scrollYProgress} labels={labels} active={near} />}</div>
        {/* degradê para o texto ficar legível sobre a cena */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-transparent sm:bg-gradient-to-r sm:from-background/90 sm:via-background/20" />
        <div className="pointer-events-none relative mx-auto flex h-full max-w-6xl px-6 pt-24 sm:items-center sm:pt-0">
          <div className="relative w-full max-w-md">
            <p className="font-mono text-xs tracking-wide text-signal">{'// '}{eyebrow}</p>
            <div className="relative mt-3 h-40">
              {CHAPTERS.map((_, i) => (
                <ChapterText key={i} progress={scrollYProgress} index={i} locale={locale} />
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

export function ProjectsStory({ labels, ...teaser }: TeaserProps & { labels: string[] }) {
  const { enabled: reduce } = useReduceMotion()
  const webgl = useSyncExternalStore(noopSubscribe, supportsWebGL, () => false)
  return (
    <>
      {!reduce && webgl && <Story labels={labels} eyebrow={teaser.eyebrow} locale={teaser.locale} />}
      <ProjectsTeaser {...teaser} />
    </>
  )
}
