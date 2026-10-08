'use client'

import { useEffect, useMemo, useState } from 'react'
import { takeHandoff } from '@/lib/handoff'
import { ProjectCard } from '@/components/project-card'
import { TechCombobox } from '@/components/tech-combobox'
import { ScrollFly } from '@/components/scroll-fly'
import { resolveText } from '@/lib/bilingual'
import type { Project, Language } from '@/lib/supabase/queries'
import type { Dictionary, Locale } from '@/lib/i18n'

export function ProjectsExplorer({
  projects,
  dict,
  locale,
}: {
  projects: Project[]
  dict: Dictionary['projetos']
  locale: Locale
}) {
  const [query, setQuery] = useState('')
  const [techFilters, setTechFilters] = useState<string[]>([])

  // filtro vindo de outro link (pílula de tecnologia), sem passar pela URL
  useEffect(() => {
    const tech = takeHandoff<string[]>('tech')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tech) setTechFilters(tech)
  }, [])

  const allLanguages = useMemo(() => {
    const byId = new Map<string, Language>()
    for (const project of projects) {
      for (const lang of project.languages) byId.set(lang.id, lang)
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [projects])

  function addTechFilter(id: string) {
    setTechFilters((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  function removeTechFilter(id: string) {
    setTechFilters((prev) => prev.filter((techId) => techId !== id))
  }

  const visible = useMemo(() => {
    let result = projects

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter((p) => {
        const haystack = [
          resolveText(p.title, p.title_en, locale),
          resolveText(p.summary, p.summary_en, locale),
          p.company ? resolveText(p.company.name, p.company.name_en, locale) : '',
          ...p.languages.map((lang) => lang.name),
          ...p.authors.map((author) => author.name),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
    }

    if (techFilters.length > 0) {
      result = result.filter((p) => p.languages.some((lang) => techFilters.includes(lang.id)))
    }

    return result
  }, [projects, query, techFilters, locale])

  const activeTechs = techFilters
    .map((id) => allLanguages.find((l) => l.id === id))
    .filter((l): l is Language => Boolean(l))

  const comboboxLanguages = allLanguages.filter((l) => !techFilters.includes(l.id))

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchPlaceholder}
          className="w-full rounded-md border border-hairline bg-background px-3 py-2 text-sm sm:max-w-xs"
        />
        {comboboxLanguages.length > 0 && (
          <TechCombobox
            languages={comboboxLanguages}
            onSelect={(lang) => addTechFilter(lang.id)}
            placeholder={dict.techPlaceholder}
          />
        )}
      </div>

      {activeTechs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeTechs.map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => removeTechFilter(lang.id)}
              className="flex items-center gap-1.5 rounded-full border border-signal px-3 py-1 font-mono text-xs text-signal"
            >
              {lang.name} <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 min-h-[220px]">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dict.notFound}</p>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2">
            {visible.map((project, i) => (
              <ScrollFly key={project.id} from={i % 2 === 0 ? 'left' : 'right'} className="mb-6 break-inside-avoid">
                <ProjectCard
                  project={project}
                  withLabel={dict.with}
                  atLabel={dict.at}
                  onTechClick={addTechFilter}
                  locale={locale}
                />
              </ScrollFly>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
