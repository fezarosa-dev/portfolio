import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'
import { ContactBlock } from '@/components/contact/contact-block'
import { ContactSpace } from '@/components/home/contact-space'
import { pageText } from '@/lib/page-texts'
import type { ContactLink } from '@/lib/supabase/queries'
import type { Dictionary, Locale } from '@/lib/i18n'

/**
 * Fim da home: o foguete termina com "Vamos construir o seu?" e chega no espaço, onde fica a central da missão
 * (o contato), na mesma noite estrelada da cena.
 */
export function ContactTeaser({
  links,
  content,
  dict,
  locale,
  launch,
  launchPoint,
}: {
  launch: { lat: number; lon: number }
  launchPoint: { x: number; y: number }
  links: ContactLink[]
  content: Record<string, string>
  dict: Dictionary
  locale: Locale
}) {
  const en = locale === 'en'
  return (
    // o globo é gerado no servidor para o ponto salvo; a versão na URL troca quando o ponto muda
    <ContactSpace globeSrc={`/api/globe?v=${launch.lat},${launch.lon}`} base={launchPoint}>
      <section id="contato" className="mx-auto max-w-4xl scroll-mt-20 px-6 pb-24 pt-[26rem] sm:pt-[32rem]">
        <FadeIn>
          <Eyebrow>{dict.contato.eyebrow}</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-4xl font-medium tracking-tight sm:text-6xl">
            {en ? 'The next mission could be yours.' : 'A próxima missão pode ser a sua.'}
          </h2>
          <p className="mt-4 max-w-xl text-lg text-steel">{pageText(content, locale, 'contato_lead')}</p>
          {/* telemetria: só fatos (canal aberto e por onde falar), nada de prazo inventado */}
          <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wide text-steel">
            <span className="flex items-center gap-2 text-signal">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal motion-reduce:animate-none" />
              {en ? 'channel open' : 'canal aberto'}
            </span>
            <span>{en ? `${links.length} channels` : `${links.length} canais`}</span>
            <span>{en ? 'scheduling · form' : 'agenda · formulário'}</span>
          </p>
        </FadeIn>
        {/* a central: o bloco de contato dentro de um painel de console */}
        <FadeIn delay={0.1} className="mt-12 overflow-hidden rounded-xl border border-signal/30 bg-[#2b2024]/70 shadow-[0_0_60px_-20px_rgba(242,102,29,0.35)] backdrop-blur">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-2.5 font-mono text-[11px] uppercase tracking-wide text-steel">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-signal" />
              {en ? 'new transmission' : 'nova transmissão'}
            </span>
            <span>zanoni.dev.br</span>
          </div>
          <div className="px-5 pb-6 sm:px-8">
            <ContactBlock links={links} content={content} dict={dict} locale={locale} />
          </div>
        </FadeIn>
      </section>
    </ContactSpace>
  )
}
