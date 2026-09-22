import { getSiteContent } from '@/lib/supabase/queries-cached'
import { getDictionary } from '@/lib/i18n'

export async function Footer() {
  const [content, { dict, locale }] = await Promise.all([getSiteContent(), getDictionary()])
  const links = [
    content.contato_email && { href: `mailto:${content.contato_email}`, label: dict.footer.email },
    content.link_github && { href: content.link_github, label: dict.footer.github },
    content.link_linkedin && { href: content.link_linkedin, label: dict.footer.linkedin },
  ].filter(Boolean) as { href: string; label: string }[]
  const legalLinks = [
    { href: `/${locale}/como-usar`, label: dict.footer.comoUsar },
    { href: `/${locale}/privacidade`, label: dict.footer.privacidade },
    { href: `/${locale}/termos`, label: dict.footer.termos },
    { href: `/${locale}/cookies`, label: dict.footer.cookies },
  ]

  return (
    <footer className="mt-auto border-t border-hairline px-6 py-8">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 font-mono text-xs text-steel sm:flex-row">
        <p className="flex flex-wrap items-center justify-center gap-3">
          <span>© {new Date().getFullYear()} Felipe Zanoni da Rosa</span>
          <a
            href={`/api?locale=${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            title="JSON com projetos, currículo e contato — pra colar num modelo de IA"
            className="rounded-full border border-hairline px-2 py-0.5 transition-colors hover:border-signal hover:text-signal"
          >
            {dict.footer.exportAi}
          </a>
          <a
            href={`/${locale}/status`}
            title="Métricas técnicas reais deste site, ao vivo"
            className="rounded-full border border-hairline px-2 py-0.5 transition-colors hover:border-signal hover:text-signal"
          >
            {dict.footer.status}
          </a>
          <a
            href={`/${locale}/busca`}
            title="Busca em linguagem natural pelo conteúdo do site"
            className="rounded-full border border-hairline px-2 py-0.5 transition-colors hover:border-signal hover:text-signal"
          >
            {dict.footer.busca}
          </a>
        </p>
        <div className="flex gap-5">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="transition-colors hover:text-signal"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-4 flex max-w-4xl flex-col items-center justify-between gap-2 font-mono text-[11px] text-steel/70 sm:flex-row">
        <div className="flex gap-4">
          {legalLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-signal">
              {link.label}
            </a>
          ))}
        </div>
        {content.mascote_ativo === 'true' && <p>{"// don't wake the dog."}</p>}
      </div>
    </footer>
  )
}
