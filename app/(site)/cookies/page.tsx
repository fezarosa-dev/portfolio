import type { Metadata } from 'next'
import { getDictionary, getLocale } from '@/lib/i18n'
import { PAGE_SEO, pageMetadata } from '@/lib/seo'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = PAGE_SEO.cookies[locale]
  return pageMetadata(locale, '/cookies', seo.title, seo.description)
}

export default async function CookiesPage() {
  const { dict, locale } = await getDictionary()
  const isEn = locale === 'en'

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.cookiesPage.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{dict.cookiesPage.title}</h1>
      </FadeIn>
      <FadeIn delay={0.1}>
        <div className="prose dark:prose-invert mt-8 max-w-none text-foreground/90 prose-a:text-signal prose-a:no-underline hover:prose-a:underline">
          {isEn ? (
            <>
              <p>Last updated: 2026.</p>
              <h2>What are cookies</h2>
              <p>Small files stored in your browser that let a site remember information between visits.</p>
              <h2>Cookies used on this site</h2>
              <table>
                <thead>
                  <tr>
                    <th>Cookie</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                    <th>Requires consent</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>theme</td>
                    <td>Remembers light/dark mode</td>
                    <td>1 year</td>
                    <td>No (essential)</td>
                  </tr>
                  <tr>
                    <td>reduce-motion</td>
                    <td>Remembers reduced-motion preference</td>
                    <td>1 year</td>
                    <td>No (essential)</td>
                  </tr>
                  <tr>
                    <td>cookie-consent</td>
                    <td>Remembers your cookie choice</td>
                    <td>1 year</td>
                    <td>No (essential)</td>
                  </tr>
                  <tr>
                    <td>_ga, _ga_*, _gid</td>
                    <td>Google Analytics — anonymized usage statistics</td>
                    <td>Up to 2 years</td>
                    <td>Yes</td>
                  </tr>
                </tbody>
              </table>
              <h2>Managing your choice</h2>
              <p>
                You can accept or decline analytics cookies in the banner shown on your first visit. To change your
                choice later, clear the <code>cookie-consent</code> cookie for this site in your browser settings and
                reload the page — the banner will reappear. You can also block cookies entirely in your browser, which
                may affect some preferences (like theme) not being remembered.
              </p>
              <h2>Related</h2>
              <p>
                See the <a href={`/${locale}/privacidade`}>Privacy Policy</a> for how any collected data is used.
              </p>
            </>
          ) : (
            <>
              <p>Última atualização: 2026.</p>
              <h2>O que são cookies</h2>
              <p>Pequenos arquivos guardados no seu navegador que permitem ao site lembrar informações entre visitas.</p>
              <h2>Cookies usados neste site</h2>
              <table>
                <thead>
                  <tr>
                    <th>Cookie</th>
                    <th>Finalidade</th>
                    <th>Duração</th>
                    <th>Exige consentimento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>theme</td>
                    <td>Lembra o modo claro/escuro</td>
                    <td>1 ano</td>
                    <td>Não (essencial)</td>
                  </tr>
                  <tr>
                    <td>reduce-motion</td>
                    <td>Lembra a preferência de redução de movimento</td>
                    <td>1 ano</td>
                    <td>Não (essencial)</td>
                  </tr>
                  <tr>
                    <td>cookie-consent</td>
                    <td>Lembra sua escolha sobre cookies</td>
                    <td>1 ano</td>
                    <td>Não (essencial)</td>
                  </tr>
                  <tr>
                    <td>_ga, _ga_*, _gid</td>
                    <td>Google Analytics — estatísticas de uso anonimizadas</td>
                    <td>Até 2 anos</td>
                    <td>Sim</td>
                  </tr>
                </tbody>
              </table>
              <h2>Gerenciando sua escolha</h2>
              <p>
                Você pode aceitar ou recusar os cookies de análise no banner exibido na primeira visita. Para mudar
                sua escolha depois, apague o cookie <code>cookie-consent</code> deste site nas configurações do
                navegador e recarregue a página — o banner volta a aparecer. Também é possível bloquear cookies
                totalmente pelo navegador, o que pode fazer preferências (como o tema) não serem lembradas.
              </p>
              <h2>Relacionado</h2>
              <p>
                Veja a <a href={`/${locale}/privacidade`}>Política de Privacidade</a> para como os dados coletados são
                usados.
              </p>
            </>
          )}
        </div>
      </FadeIn>
    </main>
  )
}
