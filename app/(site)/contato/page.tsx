import type { Metadata } from 'next'
import { ArrowUpRight, ExternalLink, Mail, MessageCircle, Phone } from 'lucide-react'
import { getContactLinks, getSiteContent } from '@/lib/supabase/queries-cached'
import { getDictionary, getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { pageMetadata } from '@/lib/seo'
import { getPageSeo } from '@/lib/seo-runtime'
import { ContactForm } from './contact-form'
import { pageText } from '@/lib/page-texts'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = await getPageSeo('contato', locale)
  return pageMetadata(locale, '/contato', seo.title, seo.description)
}

function iconFor(url: string) {
  if (url.startsWith('mailto:')) return Mail
  if (url.startsWith('tel:')) return Phone
  if (url.includes('wa.me') || url.includes('whatsapp')) return MessageCircle
  return ExternalLink
}

export default async function ContatoPage() {
  const [links, content, { dict, locale }] = await Promise.all([
    getContactLinks(),
    getSiteContent(),
    getDictionary(),
  ])
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <FadeIn>
        <Eyebrow>{dict.contato.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">{dict.contato.title}</h1>
        <p className="mt-4 max-w-xl text-lg text-steel">{pageText(content, locale, 'contato_lead')}</p>
      </FadeIn>

      <div className="mt-10 flex flex-col gap-8">
        {links.length > 0 && (
          <FadeIn delay={0.05}>
            <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {links.map((link) => {
                const Icon = iconFor(link.url)
                const external = link.url.startsWith('http')
                return (
                  <li key={link.id}>
                    <a
                      href={link.url.startsWith('www.') ? `https://${link.url}` : link.url}
                      target={external || link.url.startsWith('www.') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      data-tilt
                      className="group flex items-center gap-3 rounded-lg border border-hairline bg-card p-3 transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-signal hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-signal/10 text-signal transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {resolveText(link.label, link.label_en, locale)}
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-steel transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </FadeIn>
        )}

        <FadeIn delay={0.1}>
          <div id="formulario" className="scroll-mt-24 rounded-lg border border-hairline bg-card p-6 sm:p-8 lg:p-10">
            <h2 className="mb-5 font-display text-xl font-medium tracking-tight">{pageText(content, locale, 'contato_form_title')}</h2>
            <ContactForm dict={dict.contato} />
          </div>
        </FadeIn>
      </div>
    </main>
  )
}
