import type { Metadata } from 'next'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getSiteContent } from '@/lib/supabase/queries'
import { listDriveImages, parseDriveFolderId, resolveDriveImageUrl } from '@/lib/drive'
import { getDictionary, getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { PAGE_SEO, pageMetadata } from '@/lib/seo'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = PAGE_SEO.sobre[locale]
  return pageMetadata(locale, '/sobre', seo.title, seo.description)
}

export default async function SobrePage() {
  const [content, { dict, locale }] = await Promise.all([getSiteContent(), getDictionary()])
  const folderId = content.drive_folder_url ? parseDriveFolderId(content.drive_folder_url) : null
  const driveImages = folderId ? await listDriveImages(folderId) : []
  const photoUrl = content.sobre_foto ? resolveDriveImageUrl(content.sobre_foto, driveImages) : null

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.sobre.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{dict.sobre.title}</h1>
        {photoUrl && (
          <Image
            src={photoUrl}
            alt="Felipe Zanoni da Rosa"
            width={256}
            height={256}
            priority
            className="mx-auto mt-8 block h-64 w-64 rounded-full border border-hairline object-cover sm:mx-0"
          />
        )}
      </FadeIn>
      <FadeIn delay={0.1}>
        <div className="prose dark:prose-invert mt-8 max-w-none text-lg leading-relaxed text-foreground/90 prose-a:text-signal prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {resolveText(content.sobre_texto ?? '', content.sobre_texto_en, locale)}
          </ReactMarkdown>
        </div>
      </FadeIn>
    </main>
  )
}
