import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLanguageCategories, getLanguageUsageStats, getSiteContent } from '@/lib/supabase/queries-cached'
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
  pt: { projects: (n: number) => (n === 1 ? '1 projeto' : `${n} projetos`), none: 'ainda sem projetos', other: 'Outras', total: (n: number) => `${n} tecnologias` },
  en: { projects: (n: number) => (n === 1 ? '1 project' : `${n} projects`), none: 'no projects yet', other: 'Other', total: (n: number) => `${n} technologies` },
}

export default async function TecnologiasPage() {
  const [stats, categories, content, { dict, locale }] = await Promise.all([
    getLanguageUsageStats({ includeUnused: true }),
    getLanguageCategories(),
    getSiteContent(),
    getDictionary(),
  ])
  if (content.tecnologias_ativo === 'false') notFound()
  const t = TEXTS[locale]

  // seções na ordem das categorias; o que não tem categoria vai pra "Outras" no fim (só aparece se houver)
  const sections = [
    ...categories.map((c) => ({ id: c.id, title: resolveText(c.name, c.name_en, locale), items: stats.filter((s) => s.category_id === c.id) })),
    { id: 'other', title: categories.length ? t.other : '', items: stats.filter((s) => !categories.some((c) => c.id === s.category_id)) },
  ].filter((section) => section.items.length > 0)

  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.tecnologias.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{dict.tecnologias.title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-steel">{dict.tecnologias.lead}</p>
        <p className="mt-2 font-mono text-xs text-steel">{t.total(stats.length)}</p>
      </FadeIn>
      {sections.map((section) => (
        <section key={section.id} className="mt-12">
          {section.title && (
            <h2 className="mb-4 flex items-baseline gap-3 border-b border-hairline pb-2 font-mono text-sm uppercase tracking-wider text-steel">
              {section.title}
              <span className="text-xs normal-case">{section.items.length}</span>
            </h2>
          )}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((stat, i) => (
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
                        <h3 className="truncate font-mono text-lg font-medium text-foreground transition-colors group-hover:text-signal">
                          {stat.name}
                        </h3>
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
        </section>
      ))}
    </main>
  )
}
