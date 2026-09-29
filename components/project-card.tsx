import Link from 'next/link'
import { iconUrl } from '@/lib/icons'
import { resolveText } from '@/lib/bilingual'
import { AuthorNames } from '@/components/author-names'
import type { Project } from '@/lib/supabase/queries'
import type { Locale } from '@/lib/i18n'

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
  const href = isExternal ? project.click_url ?? '#' : `/${locale}/projetos/${project.id}`
  const title = resolveText(project.title, project.title_en, locale)
  const summary = resolveText(project.summary, project.summary_en, locale)

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
              className="hover:text-signal hover:underline"
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
        <div className="mt-4 flex flex-wrap gap-2 border-t border-hairline pt-4">
          {project.languages.map((lang) => {
            const pillClassName =
              'flex items-center gap-1 rounded-full border border-hairline px-2 py-1 font-mono text-[11px] text-steel backface-hidden transition-[transform,border-color,color] duration-150 ease-out hover:-translate-y-0.5 hover:border-signal hover:text-signal hover:will-change-transform active:translate-y-0 motion-reduce:transition-none'
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
                {lang.name}
              </>
            )

            return onTechClick ? (
              <button
                key={lang.id}
                type="button"
                onClick={() => onTechClick(lang.id)}
                title={`Filtrar por ${lang.name}`}
                className={pillClassName}
              >
                {pillContent}
              </button>
            ) : (
              <Link
                key={lang.id}
                href={`/${locale}/projetos?tech=${lang.id}`}
                title={`Ver projetos com ${lang.name}`}
                className={pillClassName}
              >
                {pillContent}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
