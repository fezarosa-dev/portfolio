import type { Metadata } from 'next'
import { getDictionary, getLocale } from '@/lib/i18n'
import { PAGE_SEO, pageMetadata } from '@/lib/seo'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = PAGE_SEO.privacidade[locale]
  return pageMetadata(locale, '/privacidade', seo.title, seo.description)
}

export default async function PrivacidadePage() {
  const { dict, locale } = await getDictionary()
  const isEn = locale === 'en'

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.privacidade.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{dict.privacidade.title}</h1>
      </FadeIn>
      <FadeIn delay={0.1}>
        <div className="prose dark:prose-invert mt-8 max-w-none text-foreground/90 prose-a:text-signal prose-a:no-underline hover:prose-a:underline">
          {isEn ? (
            <>
              <p>Last updated: 2026.</p>
              <h2>What this policy covers</h2>
              <p>
                This is the personal portfolio of Felipe Zanoni da Rosa. This policy explains what personal data is
                collected when you visit this site, why, and what rights you have over it.
              </p>
              <h2>Data collected</h2>
              <ul>
                <li>
                  <strong>Contact form:</strong> name, email and message you submit are stored to reply to your
                  inquiry. They are not sold or shared with third parties.
                </li>
                <li>
                  <strong>Preference cookies:</strong> theme (light/dark), reduced motion and language, stored to
                  remember your choices. These don&apos;t identify you personally.
                </li>
                <li>
                  <strong>Analytics cookies:</strong> if you accept them in the cookie banner, Google Analytics
                  collects anonymized usage data (pages visited, approximate location, device). See the{' '}
                  <a href={`/${locale}/cookies`}>Cookie Policy</a> for details.
                </li>
              </ul>
              <h2>Legal basis and retention</h2>
              <p>
                Contact form data is processed based on your consent (submitting the form) and kept only as long as
                needed to handle your request. Cookies are kept per the periods described in the Cookie Policy.
              </p>
              <h2>Your rights</h2>
              <p>
                Under the LGPD (Brazil) and GDPR (EU), you may request access, correction or deletion of your data,
                and withdraw consent at any time, by reaching out through the <a href={`/${locale}/contato`}>contact page</a>.
              </p>
              <h2>Changes</h2>
              <p>This policy may be updated occasionally; check back for changes.</p>
            </>
          ) : (
            <>
              <p>Última atualização: 2026.</p>
              <h2>O que esta política cobre</h2>
              <p>
                Este é o portfólio pessoal de Felipe Zanoni da Rosa. Esta política explica quais dados pessoais são
                coletados ao visitar este site, por quê, e quais direitos você tem sobre eles.
              </p>
              <h2>Dados coletados</h2>
              <ul>
                <li>
                  <strong>Formulário de contato:</strong> nome, e-mail e mensagem enviados são armazenados para
                  responder sua solicitação. Não são vendidos nem compartilhados com terceiros.
                </li>
                <li>
                  <strong>Cookies de preferência:</strong> tema (claro/escuro), redução de movimento e idioma,
                  guardados para lembrar suas escolhas. Não identificam você pessoalmente.
                </li>
                <li>
                  <strong>Cookies de análise:</strong> se aceitos no banner de cookies, o Google Analytics coleta
                  dados de uso anonimizados (páginas visitadas, localização aproximada, dispositivo). Veja a{' '}
                  <a href={`/${locale}/cookies`}>Política de Cookies</a> para detalhes.
                </li>
              </ul>
              <h2>Base legal e retenção</h2>
              <p>
                Dados do formulário de contato são tratados com base no seu consentimento (ao enviar o formulário) e
                mantidos apenas pelo tempo necessário para atender sua solicitação. Cookies seguem os prazos
                descritos na Política de Cookies.
              </p>
              <h2>Seus direitos</h2>
              <p>
                Pela LGPD (Brasil) e pelo GDPR (UE), você pode solicitar acesso, correção ou exclusão dos seus dados,
                e revogar o consentimento a qualquer momento, pela <a href={`/${locale}/contato`}>página de contato</a>.
              </p>
              <h2>Alterações</h2>
              <p>Esta política pode ser atualizada ocasionalmente; volte aqui de tempos em tempos.</p>
            </>
          )}
        </div>
      </FadeIn>
    </main>
  )
}
