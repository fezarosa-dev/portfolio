import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticleById, getSiteContent } from '@/lib/supabase/queries'
import { listDriveMedia, parseDriveFolderId } from '@/lib/drive'
import { getDictionary, getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { localizedAlternates } from '@/lib/seo'
import { MarkdownContent } from '@/components/markdown-content'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const [article, content, locale] = await Promise.all([
    getArticleById(id),
    getSiteContent(),
    getLocale(),
  ])
  if (!article || content.artigos_ativo === 'false') return {}

  const title = resolveText(article.title, article.title_en, locale)
  const summary = resolveText(article.summary, article.summary_en, locale)

  const description = summary || `Artigo de Felipe Zanoni da Rosa: ${title}.`

  return {
    title,
    description,
    alternates: localizedAlternates(locale, `/artigos/${article.id}`),
    openGraph: {
      type: 'article',
      locale: locale === 'en' ? 'en_US' : 'pt_BR',
      url: `https://www.zanoni.dev.br/${locale}/artigos/${article.id}`,
      siteName: 'Felipe Zanoni da Rosa',
      title,
      description,
    },
  }
}

export default async function ArtigoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [article, content, { dict, locale }] = await Promise.all([
    getArticleById(id),
    getSiteContent(),
    getDictionary(),
  ])
  if (!article || content.artigos_ativo === 'false') notFound()

  const folderId = content.drive_folder_url ? parseDriveFolderId(content.drive_folder_url) : null
  const driveImages = folderId ? await listDriveMedia(folderId) : []
  const title = resolveText(article.title, article.title_en, locale)
  const contentMd = resolveText(article.content_md, article.content_md_en, locale)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: resolveText(article.summary, article.summary_en, locale) || undefined,
    author: { '@type': 'Person', name: 'Felipe Zanoni da Rosa' },
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <FadeIn>
        <Link href={`/${locale}/artigos`} className="font-mono text-xs text-steel hover:text-signal">
          {dict.artigos.back}
        </Link>
        <Eyebrow>{dict.artigos.detailEyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{title}</h1>
      </FadeIn>
      <div className="mt-10">
        <MarkdownContent content={contentMd} driveImages={driveImages} />
      </div>
    </main>
  )
}
