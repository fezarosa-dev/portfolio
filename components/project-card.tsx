'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { setHandoff } from '@/lib/handoff'
import { iconUrl } from '@/lib/icons'
import { resolveText, langName } from '@/lib/bilingual'
import { AuthorNames } from '@/components/author-names'
import type { Project } from '@/lib/supabase/queries'
import type { Locale } from '@/lib/i18n'

// As tecnologias ocupam no máximo MAX_TECH_ROWS linhas: o que passar vira um chip "+N" no fim da última linha.
// É por linha e não por quantidade porque nome comprido ocupa mais espaço. O projeto continua vinculado a todas
// (filtro e busca seguem achando ele); o chip só resume a exibição e abre o resto ao clicar
const MAX_TECH_ROWS = 3

const PILL_CLASS_NAME =
  'tap-target flex items-center gap-1 rounded-full border border-hairline px-2 py-1 font-mono text-[11px] text-steel backface-hidden transition-[transform,border-color,color] duration-150 ease-out hover:-translate-y-0.5 hover:border-signal hover:text-signal hover:will-change-transform active:translate-y-0 motion-reduce:transition-none'

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function ProjectCard({
  project,
  withLabel = 'com',
  atLabel = 'em',
  onTechClick,
  locale = 'pt',
}: {
  project: Project
  withLabel?: string
  atLabel?: string
  onTechClick?: (languageId: string) => void
  locale?: Locale
}) {
  const isExternal = project.click_mode === 'link'
  const href = isExternal ? project.click_url ?? '#' : `/${locale}/projetos/${project.slug}`
  const title = resolveText(project.title, project.title_en, locale)
  const summary = resolveText(project.summary, project.summary_en, locale)
  const techListRef = useRef<HTMLDivElement>(null)
  const [showAllTechs, setShowAllTechs] = useState(false)
  const [techListWidth, setTechListWidth] = useState(0)
  // a medição vale só para a largura em que foi feita; largura nova = mede de novo a partir de todas.
  // count null = mostrando todas (estado de medição); número = quantas cabem antes do chip "+N"
  const [techFit, setTechFit] = useState<{ width: number; count: number | null }>({ width: 0, count: null })
  const visibleTechCount = techFit.width === techListWidth ? techFit.count : null

  useEffect(() => {
    const el = techListRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setTechListWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // roda antes da pintura até caber: com todas, conta quantas cabem nas linhas; com o chip, se ele ainda cair
  // numa linha a mais, tira uma tecnologia
  useLayoutEffect(() => {
    const el = techListRef.current
    if (!el || showAllTechs) return
    const items = Array.from(el.children) as HTMLElement[]
    const rowTops = [...new Set(items.map((item) => item.offsetTop))].sort((a, b) => a - b)
    if (rowTops.length <= MAX_TECH_ROWS) return
    if (visibleTechCount === null) {
      const lastRowTop = rowTops[MAX_TECH_ROWS - 1]
      setTechFit({ width: techListWidth, count: items.filter((item) => item.offsetTop <= lastRowTop).length - 1 })
    } else if (visibleTechCount > 0) {
      setTechFit({ width: techListWidth, count: visibleTechCount - 1 })
    }
  }, [showAllTechs, visibleTechCount, techListWidth])

  const collapsed = !showAllTechs && visibleTechCount !== null
  const visibleLanguages = collapsed ? project.languages.slice(0, visibleTechCount) : project.languages
  const hiddenLanguages = collapsed ? project.languages.slice(visibleTechCount) : []

  return (
    <div data-tilt className="group rounded-lg border border-hairline bg-card p-6 transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-signal hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="block"
      >
        <h3 className="font-display text-lg font-medium tracking-tight">
          {title}
          <span className="ml-1 text-signal opacity-0 transition-opacity group-hover:opacity-100">
            ↗
          </span>
        </h3>
        <p className="mt-2 text-sm text-steel">{summary}</p>
      </Link>
      {project.authors.length > 0 && (
        <p className="mt-2 font-mono text-xs font-medium text-foreground/80">
          {withLabel} <AuthorNames authors={project.authors} />
        </p>
      )}
      {project.company && (
        <p className="mt-1 font-mono text-xs font-medium text-foreground/80">
          {atLabel}{' '}
          {project.company.url ? (
            <a
              href={project.company.url}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target hover:text-signal hover:underline"
            >
              {resolveText(project.company.name, project.company.name_en, locale)}
            </a>
          ) : (
            resolveText(project.company.name, project.company.name_en, locale)
          )}
        </p>
      )}
      {(project.repo_url || project.site_url) && (
        <Link
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-steel"
        >
          {project.repo_url && <span className="break-words">{hostname(project.repo_url)}</span>}
          {project.site_url && <span className="break-words">{hostname(project.site_url)}</span>}
        </Link>
      )}
      {project.languages.length > 0 && (
        <div ref={techListRef} className="mt-4 flex flex-wrap gap-2 border-t border-hairline pt-4">
          {visibleLanguages.map((lang) => {
            const pillContent = (
              <>
                {lang.devicon_slug && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={iconUrl(lang.devicon_slug, lang.devicon_variant ?? 'plain', lang.icon_source)}
                    alt=""
                    className="h-4 w-4"
                  />
                )}
                {langName(lang, locale)}
              </>
            )

            return onTechClick ? (
              <button
                key={lang.id}
                type="button"
                onClick={() => onTechClick(lang.id)}
                title={`Filtrar por ${langName(lang, locale)}`}
                className={PILL_CLASS_NAME}
              >
                {pillContent}
              </button>
            ) : (
              <Link
                key={lang.id}
                href={`/${locale}/projetos`}
                onClick={() => setHandoff('tech', [lang.id])}
                title={`Ver projetos com ${langName(lang, locale)}`}
                className={PILL_CLASS_NAME}
              >
                {pillContent}
              </Link>
            )
          })}
          {hiddenLanguages.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAllTechs(true)}
              title={hiddenLanguages.map((lang) => langName(lang, locale)).join(', ')}
              aria-label={
                locale === 'en'
                  ? `Show ${hiddenLanguages.length} more technologies`
                  : `Mostrar mais ${hiddenLanguages.length} tecnologias`
              }
              className={PILL_CLASS_NAME}
            >
              +{hiddenLanguages.length}
            </button>
          )}
          {showAllTechs && (
            <button
              type="button"
              onClick={() => setShowAllTechs(false)}
              title={locale === 'en' ? 'Show less' : 'Mostrar menos'}
              className={PILL_CLASS_NAME}
            >
              {locale === 'en' ? '− less' : '− menos'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
