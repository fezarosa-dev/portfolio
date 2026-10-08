import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLanguageCategories, getLanguageUsageStats, getSiteContent } from '@/lib/supabase/queries-cached'
import { getDictionary, getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { iconUrl } from '@/lib/icons'
import { pageMetadata } from '@/lib/seo'
import { getPageSeo } from '@/lib/seo-runtime'
import { TechCard } from '@/components/tech-card'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = await getPageSeo('tecnologias', locale)
  return pageMetadata(locale, '/tecnologias', seo.title, seo.description)
}

const TEXTS = {
  pt: {
    projects: (n: number) => (n === 1 ? '1 projeto' : `${n} projetos`),
    none: 'ainda sem projetos',
    prev: 'Projetos anteriores',
    next: 'Próximos projetos',
    other: 'Outras',
    total: (n: number) => `${n} tecnologias`,
  },
  en: {
    projects: (n: number) => (n === 1 ? '1 project' : `${n} projects`),
    none: 'no projects yet',
    prev: 'Previous projects',
    next: 'Next projects',
    other: 'Other',
    total: (n: number) => `${n} technologies`,
  },
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
    ...categories.map((c) => ({
      id: c.id,
      title: resolveText(c.name, c.name_en, locale),
      items: stats.filter((s) => s.category_id === c.id),
    })),
    {
      id: 'other',
      title: categories.length ? t.other : '',
      items: stats.filter((s) => !categories.some((c) => c.id === s.category_id)),
    },
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
                <TechCard
                  index={i}
                  locale={locale}
                  labels={{
                    projects: t.projects(stat.projects.length),
                    none: t.none,
                    prev: t.prev,
                    next: t.next,
                  }}
                  tech={{
                    id: stat.id,
                    name: stat.name,
                    icon: stat.devicon_slug
                      ? iconUrl(stat.devicon_slug, stat.devicon_variant ?? 'plain', stat.icon_source)
                      : null,
                    percentage: stat.percentage,
                    projects: stat.projects.map((p) => ({
                      id: p.id,
                      title: resolveText(p.title, p.title_en, locale),
                    })),
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
