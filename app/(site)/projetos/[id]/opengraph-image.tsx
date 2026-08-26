import { getProjectById, getSiteContent } from '@/lib/supabase/queries'
import { parseDriveFolderId } from '@/lib/drive'
import { getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import {
  renderOgImage,
  resolveMarkdownImage,
  truncate,
  OG_IMAGE_SIZE,
  OG_IMAGE_CONTENT_TYPE,
} from '@/lib/og-image'

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
  const contentMd = resolveText(project.content_md, project.content_md_en, locale)

  const content = await getSiteContent()
  const folderId = content.drive_folder_url ? parseDriveFolderId(content.drive_folder_url) : null
  const imageSrc = await resolveMarkdownImage(contentMd, folderId)

  return renderOgImage({
    eyebrow: '$ cat projeto.md',
    title,
    subtitle: summary ? truncate(summary, 100) : undefined,
    imageSrc,
  })
}
