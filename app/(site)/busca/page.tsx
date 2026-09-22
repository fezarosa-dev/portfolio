import type { Metadata } from 'next'
import { getDictionary, getLocale } from '@/lib/i18n'
import { PAGE_SEO, pageMetadata } from '@/lib/seo'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'
import { SearchPanel } from '@/components/search/search-panel'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = PAGE_SEO.busca[locale]
  return pageMetadata(locale, '/busca', seo.title, seo.description)
}

export default async function BuscaPage() {
  const { dict, locale } = await getDictionary()

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.busca.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{dict.busca.title}</h1>
        <p className="mt-3 max-w-lg text-steel">{dict.busca.subtitle}</p>
      </FadeIn>
      <FadeIn delay={0.1} className="mt-10">
        <SearchPanel
          locale={locale}
          placeholder={dict.busca.placeholder}
          noResultsLabel={dict.busca.noResults}
          autoFocus
        />
      </FadeIn>
    </main>
  )
}
