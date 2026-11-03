import type { Metadata } from 'next'
import { SplitTitle } from '@/components/split-title'
import { getContactLinks, getSiteContent } from '@/lib/supabase/queries-cached'
import { getDictionary, getLocale } from '@/lib/i18n'
import { pageMetadata } from '@/lib/seo'
import { getPageSeo } from '@/lib/seo-runtime'
import { ContactBlock } from '@/components/contact/contact-block'
import { pageText } from '@/lib/page-texts'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = await getPageSeo('contato', locale)
  return pageMetadata(locale, '/contato', seo.title, seo.description)
}

export default async function ContatoPage() {
  const [links, content, { dict, locale }] = await Promise.all([getContactLinks(), getSiteContent(), getDictionary()])
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <FadeIn>
        <Eyebrow>{dict.contato.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
          <SplitTitle text={dict.contato.title} />
        </h1>
        <p className="mt-4 max-w-xl text-lg text-steel">{pageText(content, locale, 'contato_lead')}</p>
      </FadeIn>

      <ContactBlock links={links} content={content} dict={dict} locale={locale} />
    </main>
  )
}
