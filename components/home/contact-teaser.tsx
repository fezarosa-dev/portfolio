import { Eyebrow } from '@/components/eyebrow'
import { ContactBlock } from '@/components/contact/contact-block'
import { pageText } from '@/lib/page-texts'
import type { ContactLink } from '@/lib/supabase/queries'
import type { Dictionary, Locale } from '@/lib/i18n'

/**
 * Fim da home: o foguete termina com "Vamos construir o seu?" e logo abaixo vem o contato, na mesma noite estrelada
 * da cena (sem quebra entre os dois).
 */
export function ContactTeaser({
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
    <div className="scene-night">
      <section id="contato" className="mx-auto max-w-4xl scroll-mt-20 px-6 py-20">
        <Eyebrow>{dict.contato.eyebrow}</Eyebrow>
        <h2 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">{dict.contato.title}</h2>
        <p className="mt-4 max-w-xl text-lg text-steel">{pageText(content, locale, 'contato_lead')}</p>
        <ContactBlock links={links} content={content} dict={dict} locale={locale} />
      </section>
    </div>
  )
}
