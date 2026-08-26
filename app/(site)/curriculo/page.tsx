import type { Metadata } from 'next'
import { getResume, getResumeLinks, getSiteContent } from '@/lib/supabase/queries'
import { listDriveMedia, parseDriveFolderId } from '@/lib/drive'
import { getDictionary, getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { PAGE_SEO, localizedAlternates } from '@/lib/seo'
import { MarkdownContent } from '@/components/markdown-content'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = PAGE_SEO.curriculo[locale]
  return { title: seo.title, description: seo.description, alternates: localizedAlternates(locale, '/curriculo') }
}

export default async function CurriculoPage() {
  const [resume, links, content, { dict, locale }] = await Promise.all([
    getResume(),
    getResumeLinks(),
    getSiteContent(),
    getDictionary(),
  ])
  const folderId = content.drive_folder_url ? parseDriveFolderId(content.drive_folder_url) : null
  const driveImages = folderId ? await listDriveMedia(folderId) : []
  const resumeMd = resolveText(resume.content_md, resume.content_md_en, locale)

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.curriculo.eyebrow}</Eyebrow>
      </FadeIn>
      {links.length > 0 && (
        <FadeIn delay={0.1}>
          <ul className="mt-4 flex flex-wrap gap-2">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1 font-mono text-xs text-steel transition-colors hover:border-signal hover:text-signal"
                >
                  {resolveText(link.label, link.label_en, locale)}
                </a>
              </li>
            ))}
          </ul>
        </FadeIn>
      )}
      <div className="mt-6">
        <MarkdownContent content={resumeMd} driveImages={driveImages} />
      </div>
    </main>
  )
}
