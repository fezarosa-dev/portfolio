import { getSiteContent } from '@/lib/supabase/queries-cached'
import { renderOgImage, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from '@/lib/og-image'

export const size = OG_IMAGE_SIZE
export const contentType = OG_IMAGE_CONTENT_TYPE
export const alt = 'Felipe Zanoni da Rosa — Desenvolvedor de Software'

export default async function OpengraphImage() {
  const content = await getSiteContent()

  return renderOgImage({
    title: content.hero_title || 'Felipe Zanoni da Rosa',
    subtitle: content.hero_subtitle || 'Software Engineer',
  })
}
