import type { Metadata } from 'next'
import { SplitTitle } from '@/components/split-title'
import { getResumeSourceCached } from '@/lib/supabase/queries-cached'
import { buildResume, hasStructuredResume } from '@/lib/resume'
import { ResumeView } from '@/components/resume-view'
import { getDictionary, getLocale } from '@/lib/i18n'
import { pageMetadata } from '@/lib/seo'
import { getPageSeo } from '@/lib/seo-runtime'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = await getPageSeo('curriculo', locale)
  return pageMetadata(locale, '/curriculo', seo.title, seo.description)
}

export default async function CurriculoPage() {
  const [source, { dict, locale }] = await Promise.all([getResumeSourceCached(), getDictionary()])
  const structured = buildResume(source, locale)
  const useStructured = hasStructuredResume(structured)

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.curriculo.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight"><SplitTitle text={dict.curriculo.title} /></h1>
      </FadeIn>
      {useStructured && (
        <FadeIn delay={0.1}>
          <ul className="mt-4 flex flex-wrap gap-2">
            {(['pt', 'en'] as const).map((lang) => (
              <li key={lang}>
                <a
                  href={`/api/curriculo/pdf?lang=${lang}`}
                  download
                  className="flex items-center gap-1.5 rounded-full border border-signal px-3 py-1 font-mono text-xs text-signal transition-colors hover:bg-signal/10"
                >
                  {lang === 'pt' ? 'Baixar PDF — PT' : 'Download PDF — EN'}
                </a>
              </li>
            ))}
          </ul>
        </FadeIn>
      )}
      <div className="mt-6">
        {useStructured && <ResumeView resume={structured} locale={locale} />}
      </div>
    </main>
  )
}
