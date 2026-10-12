import { unstable_cache } from 'next/cache'
import { renderToBuffer } from '@react-pdf/renderer'
import { createPublicClient } from '@/lib/supabase/public-client'
import { getResumeSource } from '@/lib/supabase/resume-queries'
import { buildResume } from '@/lib/resume'
import { ResumePdf } from '@/components/resume-pdf'
import type { Locale } from '@/lib/i18n/dictionaries'

export const runtime = 'nodejs'

// O PDF é regenerado no máximo 1x por minuto por idioma (e na hora, quando o admin salva: tag 'site').
const buildPdf = unstable_cache(
  async (locale: Locale) => {
    const resume = buildResume(await getResumeSource(createPublicClient()), locale)
    const pdf = await renderToBuffer(ResumePdf({ resume, locale }))
    return { base64: pdf.toString('base64'), name: resume.name }
  },
  ['resume-pdf'],
  { tags: ['site'], revalidate: 60 }
)

export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get('lang')
  const locale: Locale = lang === 'en' ? 'en' : 'pt'
  const { base64, name } = await buildPdf(locale)
  const filename = `${(name || 'curriculo').replace(/\s+/g, '-')}-${locale === 'en' ? 'Resume-EN' : 'Curriculo-PT'}.pdf`

  return new Response(Buffer.from(base64, 'base64'), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
