import { getProjectById } from '@/lib/supabase/queries'
import { getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { renderOgImage, truncate, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from '@/lib/og-image'

export const size = OG_IMAGE_SIZE
export const contentType = OG_IMAGE_CONTENT_TYPE

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, locale] = await Promise.all([getProjectById(id), getLocale()])

  if (!project || project.click_mode === 'link') {
    return renderOgImage({ eyebrow: '$ ls projetos/', title: 'Projeto' })
  }

  const title = resolveText(project.title, project.title_en, locale) || 'Projeto'
  const summary = resolveText(project.summary, project.summary_en, locale)

  return renderOgImage({
    eyebrow: '$ cat projeto.md',
    title,
    subtitle: summary ? truncate(summary, 100) : undefined,
  })
}
