// Gerador único do card de compartilhamento (Open Graph). O idioma vai na URL
// (/api/og/en/sobre) pra que /pt e /en tenham imagens diferentes: com a mesma URL pros dois,
// WhatsApp/LinkedIn guardavam uma imagem só. pageMetadata (lib/seo.ts) monta o link.
import { notFound } from 'next/navigation'
import { getArticleById, getProjectById, getSiteContent } from '@/lib/supabase/queries-cached'
import { parseDriveFolderId } from '@/lib/drive'
import { resolveText } from '@/lib/bilingual'
import { PAGE_SEO } from '@/lib/seo'
import { getPageSeo } from '@/lib/seo-runtime'
import { renderOgImage, resolveMarkdownImage } from '@/lib/og-image'
import type { Locale } from '@/lib/i18n'

const EYEBROW: Record<string, Record<Locale, string>> = {
  sobre: { pt: '$ cat sobre.md', en: '$ cat about.md' },
  servicos: { pt: '$ ls servicos/', en: '$ ls services/' },
  projetos: { pt: '$ ls projetos/', en: '$ ls projects/' },
  artigos: { pt: '$ ls artigos/', en: '$ ls articles/' },
  contato: { pt: '$ contato --info', en: '$ contact --info' },
  curriculo: { pt: '$ cat curriculo.pdf', en: '$ cat resume.pdf' },
  projeto: { pt: '$ cat projeto.md', en: '$ cat project.md' },
  artigo: { pt: '$ cat artigo.md', en: '$ cat article.md' },
}

async function contentImage(markdown: string) {
  const content = await getSiteContent()
  const folderId = content.drive_folder_url ? parseDriveFolderId(content.drive_folder_url) : null
  return resolveMarkdownImage(markdown, folderId)
}

async function homeCard(locale: Locale) {
  const content = await getSiteContent()
  return renderOgImage({
    title: resolveText(content.hero_title ?? '', content.hero_title_en, locale) || 'Felipe Zanoni da Rosa',
    subtitle: resolveText(content.hero_subtitle ?? '', content.hero_subtitle_en, locale) || 'Software Engineer',
  })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; path?: string[] }> }
) {
  const { locale, path = [] } = await params
  if (locale !== 'pt' && locale !== 'en') notFound()
  const [section, id] = path

  if (section === 'projetos' && id) {
    const project = await getProjectById(id)
    if (!project || project.click_mode === 'link') return homeCard(locale)
    const contentMd = resolveText(project.content_md, project.content_md_en, locale)
    return renderOgImage({
      eyebrow: EYEBROW.projeto[locale],
      title: resolveText(project.title, project.title_en, locale) || 'Projeto',
      subtitle: resolveText(project.summary, project.summary_en, locale),
      imageSrc: await contentImage(contentMd),
    })
  }

  if (section === 'artigos' && id) {
    const article = await getArticleById(id)
    if (!article) return homeCard(locale)
    const contentMd = resolveText(article.content_md, article.content_md_en, locale)
    return renderOgImage({
      eyebrow: EYEBROW.artigo[locale],
      title: resolveText(article.title, article.title_en, locale) || 'Artigo',
      subtitle: resolveText(article.summary, article.summary_en, locale),
      imageSrc: await contentImage(contentMd),
    })
  }

  // /como-usar → chave comoUsar do PAGE_SEO
  const pageKey = section?.replace(/-(\w)/g, (_, c: string) => c.toUpperCase())
  if (pageKey && pageKey in PAGE_SEO) {
    const seo = await getPageSeo(pageKey, locale)
    return renderOgImage({
      eyebrow: EYEBROW[pageKey]?.[locale],
      title: seo.title,
      subtitle: seo.description,
    })
  }

  return homeCard(locale)
}
