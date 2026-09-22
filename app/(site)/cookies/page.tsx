import type { Metadata } from 'next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getSiteContent } from '@/lib/supabase/queries-cached'
import { getDictionary, getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { pageMetadata } from '@/lib/seo'
import { getPageSeo } from '@/lib/seo-runtime'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = await getPageSeo('cookies', locale)
  return pageMetadata(locale, '/cookies', seo.title, seo.description)
}

export default async function CookiesPage() {
  const [content, { dict, locale }] = await Promise.all([getSiteContent(), getDictionary()])

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.cookiesPage.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{dict.cookiesPage.title}</h1>
      </FadeIn>
      <FadeIn delay={0.1}>
        <div className="prose dark:prose-invert mt-8 max-w-none text-foreground/90 prose-a:text-signal prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {resolveText(content.cookies_texto ?? '', content.cookies_texto_en, locale)}
          </ReactMarkdown>
        </div>
      </FadeIn>
    </main>
  )
}
