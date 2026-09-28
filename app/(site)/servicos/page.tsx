import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Briefcase, Boxes, Code2, Globe, Server, Terminal, Workflow } from 'lucide-react'
import { getSiteContent } from '@/lib/supabase/queries-cached'
import { getDictionary, getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { pageMetadata } from '@/lib/seo'
import { getPageSeo } from '@/lib/seo-runtime'
import { pageText } from '@/lib/page-texts'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'
import { buttonVariants } from '@/components/ui/button'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = await getPageSeo('servicos', locale)
  return pageMetadata(locale, '/servicos', seo.title, seo.description)
}

const ICONS = [Globe, Workflow, Server, Code2, Boxes, Terminal]

// servicos_texto: blocos separados por linha em branco; 1ª linha = título (com ou sem **), resto = descrição.
function parseServices(text: string) {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((block) => {
      const [title, ...rest] = block.trim().split(/\r?\n/)
      return { title: title.replace(/\*\*/g, '').trim(), description: rest.join(' ').trim() }
    })
    .filter((s) => s.title)
}

export default async function ServicosPage() {
  const [content, { dict, locale }] = await Promise.all([getSiteContent(), getDictionary()])
  const t = (key: Parameters<typeof pageText>[2]) => pageText(content, locale, key)
  const services = parseServices(resolveText(content.servicos_texto ?? '', content.servicos_texto_en, locale))

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.servicos.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">{dict.servicos.title}</h1>
        <p className="mt-4 max-w-xl text-lg text-steel">{t('servicos_lead')}</p>
      </FadeIn>

      <FadeIn delay={0.05} className="mt-12">
        <section className="rounded-lg border border-signal/40 bg-signal/5 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-signal text-primary-foreground">
              <Briefcase className="h-5 w-5" />
            </span>
            <h2 className="font-display text-2xl font-medium tracking-tight">{t('servicos_hire_title')}</h2>
          </div>
          <p className="mt-4 max-w-2xl leading-relaxed text-foreground/90">{t('servicos_hire_text')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/${locale}/curriculo`} className={buttonVariants({ size: 'lg' })} data-slot="button">
              {t('servicos_hire_resume')}
            </Link>
            <Link href={`/${locale}/contato`} className={buttonVariants({ size: 'lg', variant: 'outline' })} data-slot="button">
              {t('servicos_hire_contact')}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </section>
      </FadeIn>

      <h2 className="mt-16 font-display text-2xl font-medium tracking-tight">{t('servicos_projects_title')}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {services.map((service, i) => {
          const Icon = ICONS[i % ICONS.length]
          return (
            <FadeIn key={service.title} delay={0.05 * i}>
              <div
                data-tilt
                className="group h-full rounded-lg border border-hairline bg-card p-6 transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-signal hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-signal/10 text-signal transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-steel">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h2 className="mt-5 font-display text-xl font-medium tracking-tight">{service.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-steel">{service.description}</p>
              </div>
            </FadeIn>
          )
        })}
      </div>

      <FadeIn className="mt-12">
        <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-signal/40 bg-signal/5 p-6 sm:flex-row sm:items-center">
          <p className="font-display text-xl font-medium tracking-tight">{t('servicos_cta_title')}</p>
          <Link href={`/${locale}/contato`} className={buttonVariants({ size: 'lg' })} data-slot="button">
            {t('servicos_cta_button')}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </FadeIn>
    </main>
  )
}
