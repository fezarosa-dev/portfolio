import type { Metadata } from 'next'
import { getDictionary, getLocale } from '@/lib/i18n'
import { pageMetadata } from '@/lib/seo'
import { getPageSeo } from '@/lib/seo-runtime'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'
import { ArchitectureMap } from '@/components/architecture-map/architecture-map'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = await getPageSeo('comoFunciona', locale)
  return pageMetadata(locale, '/como-funciona', seo.title, seo.description)
}

export default async function ComoFuncionaPage() {
  const { dict } = await getDictionary()

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.comoFunciona.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{dict.comoFunciona.title}</h1>
        <p className="mt-3 max-w-lg text-steel">{dict.comoFunciona.subtitle}</p>
      </FadeIn>
      <FadeIn delay={0.1} className="mt-12">
        <ArchitectureMap />
      </FadeIn>
    </main>
  )
}
