'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Eyebrow } from '@/components/eyebrow'
import { ProjectCard } from '@/components/project-card'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import type { Project } from '@/lib/supabase/queries'
import type { Locale } from '@/lib/i18n'

export function ProjectsTeaser({
  projects,
  eyebrow,
  heading,
  seeAll,
  withLabel,
  atLabel,
  locale,
}: {
  projects: Project[]
  eyebrow: string
  heading: string
  seeAll: string
  withLabel: string
  atLabel: string
  locale: Locale
}) {
  const { enabled: reduceMotion } = useReduceMotion()

  return (
    <section className="border-t border-hairline px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-3 text-3xl font-medium tracking-tight">{heading}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {projects.slice(0, 4).map((project, i) => (
            <motion.div
              key={project.id}
              initial={reduceMotion ? false : { opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProjectCard project={project} withLabel={withLabel} atLabel={atLabel} locale={locale} />
            </motion.div>
          ))}
        </div>
        <div className="mt-10">
          <Link href={`/${locale}/projetos`} className="font-mono text-sm text-signal hover:underline">
            {seeAll}
          </Link>
        </div>
      </div>
    </section>
  )
}
