import type { Metadata } from 'next'
import Link from 'next/link'
import { getLanguageUsageStats } from '@/lib/supabase/queries-cached'
import { getDictionary, getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { iconUrl } from '@/lib/icons'
import { pageMetadata } from '@/lib/seo'
import { getPageSeo } from '@/lib/seo-runtime'
import { HandoffLink } from '@/components/handoff-link'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = await getPageSeo('tecnologias', locale)
  return pageMetadata(locale, '/tecnologias', seo.title, seo.description)
}

const TEXTS = {
  pt: { projects: (n: number) => (n === 1 ? '1 projeto' : `${n} projetos`), none: 'ainda sem projetos', total: (n: number) => `${n} tecnologias` },
  en: { projects: (n: number) => (n === 1 ? '1 project' : `${n} projects`), none: 'no projects yet', total: (n: number) => `${n} technologies` },
}

export default async function TecnologiasPage() {
  const [stats, { dict, locale }] = await Promise.all([
    getLanguageUsageStats({ includeUnused: true }),
    getDictionary(),
  ])
  const t = TEXTS[locale]

  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.tecnologias.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{dict.tecnologias.title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-steel">{dict.tecnologias.lead}</p>
        <p className="mt-2 font-mono text-xs text-steel">{t.total(stats.length)}</p>
      </FadeIn>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <li key={stat.id}>
            <FadeIn delay={Math.min(i * 0.03, 0.4)} className="h-full">
              <article className="flex h-full flex-col rounded-xl border border-hairline bg-card p-5 transition-colors hover:border-signal/60">
                <HandoffLink
                  href={`/${locale}/projetos`}
                  handoff={['tech', [stat.id]]}
                  className="group flex items-center gap-3"
                >
                  {stat.devicon_slug ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={iconUrl(stat.devicon_slug, stat.devicon_variant ?? 'plain', stat.icon_source)}
                      alt=""
                      className="h-12 w-12 shrink-0"
                    />
                  ) : (
                    <span className="h-12 w-12 shrink-0 rounded-lg bg-hairline" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-mono text-lg font-medium text-foreground transition-colors group-hover:text-signal">
                      {stat.name}
                    </h2>
                    <p className="font-mono text-xs text-steel">
                      {stat.projects.length ? t.projects(stat.projects.length) : t.none}
                    </p>
                  </div>
                  <span className="font-mono text-2xl font-medium text-signal">{stat.percentage}%</span>
                </HandoffLink>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-hairline">
                  <div className="h-full rounded-full bg-signal" style={{ width: `${stat.percentage}%` }} />
                </div>
                {stat.projects.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {stat.projects.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/${locale}/projetos/${p.id}`}
                          className="block rounded-md border border-hairline px-2 py-1 text-xs text-foreground/80 transition-colors hover:border-signal hover:text-signal"
                        >
                          {resolveText(p.title, p.title_en, locale)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </FadeIn>
          </li>
        ))}
      </ul>
    </main>
  )
}
