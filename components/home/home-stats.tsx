'use client'

import { useEffect, useRef } from 'react'
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

function StatBlock({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' })
  return (
    <p ref={ref} className="flex items-baseline gap-3 border-t border-hairline py-8">
      <span className="font-display text-6xl font-medium tabular-nums text-signal">
        <CountUp value={value} start={inView} />
      </span>
      <span className={STAT_LABEL_CLASS}>{label}</span>
    </p>
  )
}

// fim da home no celular (no lugar da busca): só os números da cena 3D, contando quando entram na tela
export function DeliveredSection({
  stats,
  locale,
  eyebrow,
  title,
}: {
  stats: HomeStats
  locale: Locale
  eyebrow: string
  title: string
}) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-20">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-4xl font-medium tracking-tight">{title}</h2>
      <div className="mt-8">
        {statItems(stats, locale).map((item) => (
          <StatBlock key={item.key} value={item.value} label={item.label} />
        ))}
      </div>
    </section>
  )
}
