'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, transform, useInView, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import { ProjectsTeaser } from '@/components/home/projects-teaser'
import type { Locale } from '@/lib/i18n'
import { SceneLoader } from './scene-loader'
import type { ServerProject } from './servers'
import { HOME_SERVERS } from '@/lib/home-servers'
import type { LanguageCategory, Project } from '@/lib/supabase/queries'

// o 3D (three + react-three-fiber) vira um pacote à parte, fora do carregamento inicial da página
const loadScene = () => import('./pc-scene')
const PcScene = dynamic(loadScene, { ssr: false })

type Stats = { projects: number; technologies: number; companies: number }

type TeaserProps = React.ComponentProps<typeof ProjectsTeaser>

// o PC é metáfora de uma solução de software (não de trabalho com hardware): os textos deixam isso claro
// `nav`: nome curto no indicador de capítulos da direita (quando o título é longo demais)
const CHAPTERS: { at: number; pt: [string, string]; en: [string, string]; nav?: [string, string] }[] = [
  { at: 0, pt: ['Como uma solução nasce', 'Todo sistema é um conjunto de peças que precisam funcionar juntas.'], en: ['How a solution comes together', 'Every system is a set of parts that have to work together.'] },
  { at: 0.07, pt: ['Peça por peça', 'A base não é o código, é a arquitetura da solução. O código é o caminho.'], en: ['Piece by piece', "The foundation isn't the code, it's the solution architecture. Code is how you get there."] },
  { at: 0.25, pt: ['O núcleo', 'No centro de tudo, o que já foi entregue.'], en: ['The core', "At the center of it all, what's already been delivered."] },
  { at: 0.5, pt: ['Os projetos', 'Cada servidor ligado é um projeto no ar; cada gaveta, o que ele usa. Clique em um para abrir.'], en: ['The projects', 'Every server that is on is a project running; every drawer, what it runs on. Click one to open it.'] },
  { at: 0.8, pt: ['Juntos, rumo a um futuro mais automatizado.', 'Cada projeto é uma peça do próximo lançamento. Vamos construir o seu?'], en: ['Together, toward a more automated future.', 'Every project is a part of the next launch. Shall we build yours?'], nav: ['O lançamento', 'The launch'] },
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
  const shown = useTransform(progress, (v) => Math.round(transform(v, [0.3, 0.42], [0, value])))
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

// os projetos da home viram os servidores, sempre HOME_SERVERS deles: os que faltam ficam desligados
function toServers(projects: Project[], categories: LanguageCategory[], locale: Locale): ServerProject[] {
  const en = locale === 'en'
  const pick = (pt: string | null, other: string | null) => (en ? (other ?? pt) : (pt ?? other))
  const list: ServerProject[] = projects.slice(0, HOME_SERVERS).map((p) => {
    const title = (en ? (p.title_en ?? p.title) : (p.title ?? p.title_en)) ?? ''
    const company = p.company ? ((en ? (p.company.name_en ?? p.company.name) : (p.company.name ?? p.company.name_en)) ?? null) : null
    const external = p.click_mode === 'link' && !!p.click_url
    // uma gaveta por categoria de tecnologia do projeto (na ordem das categorias; sem categoria vai em "Outros")
    const drawers = [...categories, null]
      .map((c) => ({
        label: c ? (pick(c.name, c.name_en) ?? '') : en ? 'Other' : 'Outros',
        techs: p.languages.filter((l) => (c ? l.category_id === c.id : !categories.some((x) => x.id === l.category_id))).map((l) => pick(l.name, l.name_en) ?? l.name),
      }))
      .filter((d) => d.techs.length > 0)
    // no visor só o nome curto (o trecho antes do " — ")
    return {
      title: title.split(' — ')[0],
      company,
      href: external ? p.click_url! : `/${locale}/projetos/${p.slug}`,
      external,
      status: p.status,
      highlight: pick(p.highlight, p.highlight_en),
      drawers,
    }
  })
  return [...list, ...Array<ServerProject>(HOME_SERVERS - list.length).fill(null)]
}

function Story({
  eyebrow,
  locale,
  stats,
  projects,
  categories,
}: {
  eyebrow: string
  locale: Locale
  stats: Stats
  projects: Project[]
  categories: LanguageCategory[]
}) {
  const router = useRouter()
  const servers = toServers(projects, categories, locale)
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  // a cena monta bem antes da seção (e não desmonta mais) e só anima quando está perto; até o primeiro
  // quadro sair, um loader translúcido cobre a seção para ela não aparecer vazia ao rolar rápido
  const mounted = useInView(ref, { margin: '1500px 0px', once: true })
  const near = useInView(ref, { margin: '400px 0px' })
  const [ready, setReady] = useState(false)
  const cutFade = useTransform(scrollYProgress, (v) => transform(v, [0.43, 0.47, 0.51], [0, 1, 0]))
  const [chapter, setChapter] = useState(0)
  // baixa o pacote do 3D assim que o navegador fica livre, sem esperar a rolagem chegar perto
  useEffect(() => {
    if (!('requestIdleCallback' in window)) {
      const t = setTimeout(loadScene, 2000)
      return () => clearTimeout(t)
    }
    const id = requestIdleCallback(() => void loadScene(), { timeout: 4000 })
    return () => cancelIdleCallback(id)
  }, [])
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const current = CHAPTERS.reduce((acc, c, i) => (p >= c.at - 0.02 ? i : acc), 0)
    if (current !== chapter) setChapter(current)
  })

  return (
    <section ref={ref} className="relative border-t border-hairline" style={{ height: '900vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0">
          {mounted && (
            <PcScene
              progress={scrollYProgress}
              active={near}
              stats={stats}
              en={locale === 'en'}
              servers={servers}
              onOpen={(p) => (p.external ? window.open(p.href, '_blank', 'noopener,noreferrer') : router.push(p.href))}
              onReady={() => setReady(true)}
            />
          )}
        </div>
        {/* corte do processador para os servidores: escurece, a cena troca no escuro e clareia de novo */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[#2b2024]"
          style={{ opacity: cutFade }}
        />
        <AnimatePresence>
          {!ready && (
            <motion.div
              key="loader"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute inset-0 flex items-end justify-center bg-background/45 pb-[18vh] backdrop-blur-xl sm:items-center sm:pb-0"
            >
              <SceneLoader label={locale === 'en' ? 'loading the scene' : 'carregando a cena'} />
            </motion.div>
          )}
        </AnimatePresence>
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
              {i === chapter && <span>{c.nav ? c.nav[locale === 'en' ? 1 : 0] : c[locale === 'en' ? 'en' : 'pt'][0]}</span>}
              <span>{String(i + 1).padStart(2, '0')}</span>
              <span className={`h-px transition-all ${i === chapter ? 'w-8 bg-signal' : 'w-3 bg-steel/50'}`} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function ProjectsStory({ stats, categories, ...teaser }: TeaserProps & { stats: Stats; categories: LanguageCategory[] }) {
  const { enabled: reduce } = useReduceMotion()
  const webgl = useSyncExternalStore(noopSubscribe, supportsWebGL, () => false)
  return (
    <>
      {/* com a cena 3D os projetos viram os servidores; sem ela (reduzir movimento, sem WebGL) ficam os cards */}
      {!reduce && webgl ? (
        <Story eyebrow={teaser.eyebrow} locale={teaser.locale} stats={stats} projects={teaser.projects} categories={categories} />
      ) : (
        <ProjectsTeaser {...teaser} />
      )}
    </>
  )
}
