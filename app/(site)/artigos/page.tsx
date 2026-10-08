import type { Metadata } from 'next'
import { getVisibleArticles } from '@/lib/supabase/queries-cached'
import { getDictionary, getLocale } from '@/lib/i18n'
import { ArticleCard } from '@/components/article-card'
import { pageMetadata } from '@/lib/seo'
import { getPageSeo } from '@/lib/seo-runtime'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = await getPageSeo('artigos', locale)
  return pageMetadata(locale, '/artigos', seo.title, seo.description)
}

export default async function ArtigosPage() {
  const [articles, { dict, locale }] = await Promise.all([getVisibleArticles(), getDictionary()])

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.artigos.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{dict.artigos.title}</h1>
      </FadeIn>
      <div className="mt-10">
        {articles.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dict.artigos.notFound}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {articles.map((article, i) => (
              <FadeIn key={article.id} delay={i * 0.06}>
                <ArticleCard article={article} locale={locale} />
              </FadeIn>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
