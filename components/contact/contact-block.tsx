import { ArrowUpRight, CalendarDays, ExternalLink, Mail, MessageCircle, Phone } from 'lucide-react'
import { resolveText } from '@/lib/bilingual'
import { pageText } from '@/lib/page-texts'
import { FadeIn } from '@/components/fade-in'
import { ContactForm } from '@/app/(site)/contato/contact-form'
import type { ContactLink } from '@/lib/supabase/queries'
import type { Dictionary, Locale } from '@/lib/i18n'

const AGENDA_URL = 'https://calendar.app.google/DADVdtxBXMrBwSk16'

function iconFor(url: string) {
  if (url.startsWith('mailto:')) return Mail
  if (url.startsWith('tel:')) return Phone
  if (url.includes('wa.me') || url.includes('whatsapp')) return MessageCircle
  return ExternalLink
}

/** Links de contato, agenda e formulário: a página /contato e o fim da home usam o mesmo bloco. */
export function ContactBlock({
  links,
  content,
  dict,
  locale,
}: {
  links: ContactLink[]
  content: Record<string, string>
  dict: Dictionary
  locale: Locale
}) {
  return (
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

      <FadeIn delay={0.08}>
        <div className="flex flex-col gap-4 rounded-lg border border-hairline bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-signal/10 text-signal">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-medium tracking-tight">{dict.contato.scheduleTitle}</h2>
              <p className="mt-1 text-steel">{dict.contato.scheduleText}</p>
            </div>
          </div>
          <a
            href={AGENDA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {dict.contato.scheduleCta}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div id="formulario" className="scroll-mt-24 rounded-lg border border-hairline bg-card p-6 sm:p-8 lg:p-10">
          <h2 className="mb-5 font-display text-xl font-medium tracking-tight">
            {pageText(content, locale, 'contato_form_title')}
          </h2>
          <ContactForm dict={dict.contato} />
        </div>
      </FadeIn>
    </div>
  )
}
