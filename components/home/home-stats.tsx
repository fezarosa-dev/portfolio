'use client'

import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import type { Locale } from '@/lib/i18n'

// números da home (calculados em app/(site)/page.tsx): os mesmos na cena 3D e no topo do celular
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

// sobe de 0 até o total quando aparece (sem animação com "reduzir movimento")
function CountUp({ value }: { value: number }) {
  const { enabled: reduce } = useReduceMotion()
  const count = useMotionValue(0)
  const shown = useTransform(count, (v) => Math.round(v))
  useEffect(() => {
    if (reduce) {
      count.set(value)
      return
    }
    const controls = animate(count, value, { duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [count, value, reduce])
  return <motion.p className={STAT_VALUE_CLASS}>{shown}</motion.p>
}

export function HomeStatsCountUp({ stats, locale, className }: { stats: HomeStats; locale: Locale; className?: string }) {
  return (
    <div className={className}>
      {statItems(stats, locale).map((item) => (
        <div key={item.key}>
          <CountUp value={item.value} />
          <p className={STAT_LABEL_CLASS}>{item.label}</p>
        </div>
      ))}
    </div>
  )
}
