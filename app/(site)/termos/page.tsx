import type { Metadata } from 'next'
import { getDictionary, getLocale } from '@/lib/i18n'
import { PAGE_SEO, pageMetadata } from '@/lib/seo'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = PAGE_SEO.termos[locale]
  return pageMetadata(locale, '/termos', seo.title, seo.description)
}

export default async function TermosPage() {
  const { dict, locale } = await getDictionary()
  const isEn = locale === 'en'

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.termos.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{dict.termos.title}</h1>
      </FadeIn>
      <FadeIn delay={0.1}>
        <div className="prose dark:prose-invert mt-8 max-w-none text-foreground/90 prose-a:text-signal prose-a:no-underline hover:prose-a:underline">
          {isEn ? (
            <>
              <p>Last updated: 2026.</p>
              <h2>Acceptance</h2>
              <p>
                By browsing this site you agree to these terms. This is a personal, non-commercial portfolio
                published by Felipe Zanoni da Rosa.
              </p>
              <h2>Content and intellectual property</h2>
              <p>
                Text, images and project descriptions belong to Felipe Zanoni da Rosa unless stated otherwise. The
                site&apos;s source code is published under the MIT license and may be reused per that license; other
                content (writing, project write-ups, resume) may not be reproduced without permission.
              </p>
              <h2>Acceptable use</h2>
              <p>
                Do not use this site to attempt unauthorized access, disrupt its operation, or submit false, abusive
                or unlawful content through the contact form.
              </p>
              <h2>No warranty</h2>
              <p>
                The site is provided &quot;as is&quot;, without warranties of uninterrupted availability or absence
                of errors. External links (GitHub, LinkedIn, project repositories) are not controlled by this site.
              </p>
              <h2>Changes</h2>
              <p>These terms may be updated occasionally; the current version always applies.</p>
              <h2>Contact</h2>
              <p>
                Questions about these terms can be sent through the <a href={`/${locale}/contato`}>contact page</a>.
              </p>
            </>
          ) : (
            <>
              <p>Última atualização: 2026.</p>
              <h2>Aceitação</h2>
              <p>
                Ao navegar neste site, você concorda com estes termos. Este é um portfólio pessoal, sem fins
                comerciais, publicado por Felipe Zanoni da Rosa.
              </p>
              <h2>Conteúdo e propriedade intelectual</h2>
              <p>
                Textos, imagens e descrições de projetos pertencem a Felipe Zanoni da Rosa, salvo indicação em
                contrário. O código-fonte do site é publicado sob licença MIT e pode ser reutilizado conforme essa
                licença; o restante do conteúdo (textos, descrições de projetos, currículo) não pode ser reproduzido
                sem autorização.
              </p>
              <h2>Uso aceitável</h2>
              <p>
                Não utilize este site para tentar acesso não autorizado, prejudicar seu funcionamento, ou enviar
                conteúdo falso, abusivo ou ilegal pelo formulário de contato.
              </p>
              <h2>Sem garantias</h2>
              <p>
                O site é fornecido &quot;como está&quot;, sem garantia de disponibilidade ininterrupta ou ausência de
                erros. Links externos (GitHub, LinkedIn, repositórios de projetos) não são controlados por este site.
              </p>
              <h2>Alterações</h2>
              <p>Estes termos podem ser atualizados ocasionalmente; a versão vigente é sempre a atual.</p>
              <h2>Contato</h2>
              <p>
                Dúvidas sobre estes termos podem ser enviadas pela <a href={`/${locale}/contato`}>página de contato</a>.
              </p>
            </>
          )}
        </div>
      </FadeIn>
    </main>
  )
}
