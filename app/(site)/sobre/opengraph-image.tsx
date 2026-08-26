import { getLocale } from '@/lib/i18n'
import { PAGE_SEO } from '@/lib/seo'
import { renderOgImage, truncate, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from '@/lib/og-image'

export const size = OG_IMAGE_SIZE
export const contentType = OG_IMAGE_CONTENT_TYPE

export default async function Image() {
  const seo = PAGE_SEO.sobre[await getLocale()]
  return renderOgImage({
    eyebrow: '$ cat sobre.md',
    title: seo.title,
    subtitle: truncate(seo.description, 100),
  })
}
