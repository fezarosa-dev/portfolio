import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import { getDictionary, getLocale } from '@/lib/i18n'
import { pageMetadata } from '@/lib/seo'
import { getPageSeo } from '@/lib/seo-runtime'
import { ArchitectureMap } from '@/components/architecture-map/architecture-map'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = await getPageSeo('comoFunciona', locale)
  return pageMetadata(locale, '/como-funciona', seo.title, seo.description)
}

export default async function ComoFuncionaPage() {
  const { dict, locale } = await getDictionary()

  return (
    <div className="site-warm relative h-screen w-screen overflow-hidden bg-background">
      <Link
        href={`/${locale}`}
        className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full border border-hairline bg-card/80 px-3 py-1.5 font-mono text-xs text-steel backdrop-blur transition-colors hover:border-signal hover:text-signal"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden />
        {locale === 'en' ? 'back' : 'voltar'}
      </Link>
      <div className="absolute top-4 right-4 z-10 max-w-xs text-right font-mono text-xs text-steel">
        <p className="text-foreground">{dict.comoFunciona.title}</p>
        <p className="mt-1">{dict.comoFunciona.subtitle}</p>
      </div>
      <ArchitectureMap />
    </div>
  )
}
