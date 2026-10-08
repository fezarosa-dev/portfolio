'use client'

import Link from 'next/link'
import { Eyebrow } from '@/components/eyebrow'
import { ProjectCard } from '@/components/project-card'
import { ScrollFly } from '@/components/scroll-fly'
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
  return (
    <section className="border-t border-hairline px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-3 text-3xl font-medium tracking-tight">{heading}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {projects.slice(0, 4).map((project, i) => (
            <ScrollFly key={project.id} from={i % 2 === 0 ? 'left' : 'right'}>
              <ProjectCard project={project} withLabel={withLabel} atLabel={atLabel} locale={locale} />
            </ScrollFly>
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
