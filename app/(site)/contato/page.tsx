import type { Metadata } from 'next'
import { getContactLinks } from '@/lib/supabase/queries'
import { getDictionary, getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { PAGE_SEO, pageMetadata } from '@/lib/seo'
import { ContactForm } from './contact-form'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = PAGE_SEO.contato[locale]
  return pageMetadata(locale, '/contato', seo.title, seo.description)
}

export default async function ContatoPage() {
  const [links, { dict, locale }] = await Promise.all([getContactLinks(), getDictionary()])
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.contato.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{dict.contato.title}</h1>
        {links.length > 0 && (
          <ul className="mt-6 flex flex-col gap-3">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target={link.url.startsWith('http') ? '_blank' : undefined}
                  rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="group flex items-center gap-2 text-lg font-medium text-foreground transition-colors hover:text-signal"
                >
                  {resolveText(link.label, link.label_en, locale)}
                  <span className="text-signal opacity-0 transition-opacity group-hover:opacity-100">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </FadeIn>
      <FadeIn delay={0.1} className="mt-10">
        <ContactForm dict={dict.contato} />
      </FadeIn>
    </main>
  )
}
