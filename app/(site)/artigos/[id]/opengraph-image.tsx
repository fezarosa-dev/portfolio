import { getArticleById } from '@/lib/supabase/queries'
import { getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { renderOgImage, truncate, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from '@/lib/og-image'

export const size = OG_IMAGE_SIZE
export const contentType = OG_IMAGE_CONTENT_TYPE

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [article, locale] = await Promise.all([getArticleById(id), getLocale()])

  if (!article) {
    return renderOgImage({ eyebrow: '$ ls artigos/', title: 'Artigo' })
  }

  const title = resolveText(article.title, article.title_en, locale) || 'Artigo'
  const summary = resolveText(article.summary, article.summary_en, locale)

  return renderOgImage({
    eyebrow: '$ cat artigo.md',
    title,
    subtitle: summary ? truncate(summary, 100) : undefined,
  })
}
