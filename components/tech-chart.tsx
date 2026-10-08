'use client'

import Link from 'next/link'
import { iconUrl } from '@/lib/icons'
import { resolveText } from '@/lib/bilingual'
import { setHandoff } from '@/lib/handoff'
import { HandoffLink } from '@/components/handoff-link'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { getLanguageUsageStats } from '@/lib/supabase/queries-cached'
import type { Locale } from '@/lib/i18n'

type Stats = Awaited<ReturnType<typeof getLanguageUsageStats>>

const TEXTS = {
  pt: { projects: (n: number) => (n === 1 ? '1 projeto' : `${n} projetos`), none: 'Ainda não usada em projetos', all: 'ver todos →' },
  en: { projects: (n: number) => (n === 1 ? '1 project' : `${n} projects`), none: 'Not used in any project yet', all: 'see all →' },
}

// Gráfico de barras de uso por tecnologia (mesmo dado da busca), em tamanho maior, com tooltip dos projetos.
export function TechChart({ stats, locale }: { stats: Stats; locale: Locale }) {
  const t = TEXTS[locale]
  return (
    <TooltipProvider delay={80}>
      <ul className="flex flex-col gap-5">
        {stats.map((stat) => {
          const icon = stat.devicon_slug
            ? iconUrl(stat.devicon_slug, stat.devicon_variant ?? 'plain', stat.icon_source)
            : null
          return (
            <li key={stat.id} className="flex items-center gap-3">
              <HandoffLink
                href={`/${locale}/projetos`}
                handoff={['tech', [stat.id]]}
                className="flex w-32 shrink-0 items-center gap-2 transition-colors hover:text-signal sm:w-44"
              >
                {icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={icon} alt="" className="h-7 w-7 shrink-0" />
                )}
                <span className="truncate font-mono text-base text-foreground">{stat.name}</span>
              </HandoffLink>
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  className="flex h-6 flex-1 cursor-pointer items-center"
                  aria-label={`${stat.name}: ${stat.percentage}%`}
                >
                  <div className="h-4 w-full overflow-hidden rounded-full bg-hairline">
                    <div className="h-full rounded-full bg-signal" style={{ width: `${stat.percentage}%` }} />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-80 px-4 py-3 text-sm">
                  <div className="mb-2 flex items-center gap-2">
                    {icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={icon} alt="" className="h-6 w-6" />
                    )}
                    <span className="font-mono text-base font-medium">{stat.name}</span>
                    <span className="ml-auto font-mono text-signal">{stat.percentage}%</span>
                  </div>
                  <p className="mb-2 font-mono text-xs text-steel">
                    {stat.projects.length ? t.projects(stat.projects.length) : t.none}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {stat.projects.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/${locale}/projetos/${p.id}`}
                          className="block truncate text-foreground transition-colors hover:text-signal hover:underline"
                        >
                          {resolveText(p.title, p.title_en, locale)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {stat.projects.length > 0 && (
                    <Link
                      href={`/${locale}/projetos`}
                      onClick={() => setHandoff('tech', [stat.id])}
                      className="mt-3 block font-mono text-xs text-signal hover:underline"
                    >
                      {t.all}
                    </Link>
                  )}
                </TooltipContent>
              </Tooltip>
              <span className="w-12 shrink-0 text-right font-mono text-sm text-steel">{stat.percentage}%</span>
            </li>
          )
        })}
      </ul>
    </TooltipProvider>
  )
}
