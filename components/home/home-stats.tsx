'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { Eyebrow } from '@/components/eyebrow'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import type { Locale } from '@/lib/i18n'

// números da home (calculados em app/(site)/page.tsx): os mesmos na cena 3D e no fim da home no celular
export type HomeStats = { projects: number; technologies: number; companies: number }

export function statItems(stats: HomeStats, locale: Locale) {
  const en = locale === 'en'
  return [
    { key: 'projects', value: stats.projects, label: en ? 'projects' : 'projetos' },
    { key: 'technologies', value: stats.technologies, label: en ? 'technologies' : 'tecnologias' },
    { key: 'companies', value: stats.companies, label: en ? 'companies' : 'empresas' },
  ]
}

export const STAT_VALUE_CLASS = 'font-display text-4xl font-medium tabular-nums text-signal sm:text-5xl'
export const STAT_LABEL_CLASS = 'font-mono text-[11px] uppercase tracking-wide text-steel'

export type DeliveredDetails = {
  featured: { id: string; title: string; href: string; external: boolean }[]
  techs: { id: string; name: string; icon: string | null }[]
  companies: string[]
}

const CHIP = 'flex items-center gap-1.5 rounded-full border border-hairline bg-card/70 px-3 py-1 font-mono text-xs text-steel'

// sobe de 0 até o total quando o bloco entra na tela (sem animação com "reduzir movimento")
function CountUp({ value, start }: { value: number; start: boolean }) {
  const { enabled: reduce } = useReduceMotion()
  const count = useMotionValue(0)
  const shown = useTransform(count, (v) => Math.round(v))
  useEffect(() => {
    if (reduce) {
      count.set(value)
      return
    }
    if (!start) return
    const controls = animate(count, value, { duration: 1.2, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [count, value, reduce, start])
  return <motion.span>{shown}</motion.span>
}

function StatBlock({ value, label, children }: { value: number; label: string; children: React.ReactNode }) {
  const { enabled: reduce } = useReduceMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' })
  return (
    <div ref={ref} className="border-t border-hairline py-8">
      <p className="flex items-baseline gap-3">
        <span className="font-display text-6xl font-medium tabular-nums text-signal">
          <CountUp value={value} start={inView} />
        </span>
        <span className={STAT_LABEL_CLASS}>{label}</span>
      </p>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4"
      >
        {children}
      </motion.div>
    </div>
  )
}

// fim da home no celular (no lugar da busca): os números da cena 3D, cada um com o que ele representa
export function DeliveredSection({
  stats,
  details,
  locale,
  eyebrow,
  title,
  seeAll,
  clientsNote,
}: {
  stats: HomeStats
  details: DeliveredDetails
  locale: Locale
  eyebrow: string
  title: string
  seeAll: string
  clientsNote: string
}) {
  const [projects, technologies, companies] = statItems(stats, locale)
  const moreTechs = stats.technologies - details.techs.length
  return (
    <section className="mx-auto max-w-2xl px-6 py-20">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-4xl font-medium tracking-tight">{title}</h2>
      <div className="mt-8">
        <StatBlock value={projects.value} label={projects.label}>
          {details.featured.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {details.featured.map((p) => (
                <li key={p.id}>
                  {p.external ? (
                    <a href={p.href} target="_blank" rel="noopener noreferrer" className={`${CHIP} tap-target hover:border-signal hover:text-signal`}>
                      {p.title}
                    </a>
                  ) : (
                    <Link href={p.href} className={`${CHIP} tap-target hover:border-signal hover:text-signal`}>
                      {p.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Link href={`/${locale}/projetos`} className="tap-target mt-4 inline-block font-mono text-sm text-signal">
            {seeAll}
          </Link>
        </StatBlock>
        <StatBlock value={technologies.value} label={technologies.label}>
          <ul className="flex flex-wrap gap-2">
            {details.techs.map((t) => (
              <li key={t.id} className={CHIP}>
                {t.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.icon} alt="" className="h-4 w-4" />
                )}
                {t.name}
              </li>
            ))}
            {moreTechs > 0 && <li className={CHIP}>+{moreTechs}</li>}
          </ul>
        </StatBlock>
        <StatBlock value={companies.value} label={companies.label}>
          <ul className="flex flex-wrap gap-2">
            {details.companies.map((name) => (
              <li key={name} className={CHIP}>
                {name}
              </li>
            ))}
          </ul>
          {/* o número conta clientes: com grupos de cliente (freelas) ele passa da quantidade de nomes */}
          {stats.companies > details.companies.length && (
            <p className="mt-3 font-mono text-xs text-steel">{clientsNote}</p>
          )}
        </StatBlock>
      </div>
    </section>
  )
}
