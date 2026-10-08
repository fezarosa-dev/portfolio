import { iconUrl } from '@/lib/icons'
import { HandoffLink } from '@/components/handoff-link'
import type { getLanguageUsageStats } from '@/lib/supabase/queries-cached'

type Stats = Awaited<ReturnType<typeof getLanguageUsageStats>>

// Gráfico de barras de uso por tecnologia (mesmo dado da busca), em tamanho maior.
export function TechChart({ stats, locale }: { stats: Stats; locale: string }) {
  return (
    <ul className="flex flex-col gap-4">
      {stats.map((stat) => (
        <li key={stat.id} className="flex items-center gap-3">
          <HandoffLink
            href={`/${locale}/projetos`}
            handoff={['tech', [stat.id]]}
            className="flex w-32 shrink-0 items-center gap-2 transition-colors hover:text-signal sm:w-40"
          >
            {stat.devicon_slug && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={iconUrl(stat.devicon_slug, stat.devicon_variant ?? 'plain', stat.icon_source)}
                alt=""
                className="h-6 w-6 shrink-0"
              />
            )}
            <span className="truncate font-mono text-sm text-foreground">{stat.name}</span>
          </HandoffLink>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-hairline">
            <div className="h-full rounded-full bg-signal" style={{ width: `${stat.percentage}%` }} />
          </div>
          <span className="w-10 shrink-0 text-right font-mono text-xs text-steel">{stat.percentage}%</span>
        </li>
      ))}
    </ul>
  )
}
