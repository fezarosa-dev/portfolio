import type { Metadata } from 'next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getLanguageUsageStats, getSiteContent } from '@/lib/supabase/queries-cached'
import { listDriveImages, parseDriveFolderId, resolveDriveImageUrl } from '@/lib/drive'
import { getDictionary, getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { pageMetadata } from '@/lib/seo'
import { getPageSeo } from '@/lib/seo-runtime'
import { LoadingPhoto } from '@/components/loading-photo'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'
import { TechChart } from '@/components/tech-chart'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = await getPageSeo('sobre', locale)
  return pageMetadata(locale, '/sobre', seo.title, seo.description)
}

export default async function SobrePage() {
  const [content, { dict, locale }, techStats] = await Promise.all([
    getSiteContent(),
    getDictionary(),
    getLanguageUsageStats({ includeUnused: true }),
  ])
  const folderId = content.drive_folder_url ? parseDriveFolderId(content.drive_folder_url) : null
  const driveImages = folderId ? await listDriveImages(folderId) : []
  const photoUrl = content.sobre_foto ? resolveDriveImageUrl(content.sobre_foto, driveImages) : null

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.sobre.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{dict.sobre.title}</h1>
        {photoUrl && <LoadingPhoto src={photoUrl} alt="Felipe Zanoni da Rosa" />}
      </FadeIn>
      <FadeIn delay={0.1}>
        <div className="prose dark:prose-invert mt-8 max-w-none text-lg leading-relaxed text-foreground/90 prose-a:text-signal prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {resolveText(content.sobre_texto ?? '', content.sobre_texto_en, locale)}
          </ReactMarkdown>
        </div>
      </FadeIn>
      {techStats.length > 0 && (
        <FadeIn delay={0.2}>
          <h2 className="mt-16 text-2xl font-medium tracking-tight">{dict.sobre.techsTitle}</h2>
          <div className="mt-6">
            <TechChart stats={techStats} locale={locale} />
          </div>
        </FadeIn>
      )}
    </main>
  )
}
