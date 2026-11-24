import type { Locale } from './i18n/dictionaries.ts'

/** Link curto do botão de compartilhar: o idioma vai no link pra o card do LinkedIn/WhatsApp sair no idioma certo. */
export function shortLinkPath(locale: Locale, slug: string) {
  return `/${locale}/p/${slug}`
}

/**
 * Para onde um link curto leva: /<idioma>/p/<slug> → /<idioma>/projetos/<slug>. O formato antigo /p/<slug>
 * (sem idioma, links já compartilhados) usa o idioma de quem abre. Retorna null se não for link curto.
 */
export function resolveShortLink(pathname: string, visitorLocale: Locale): string | null {
  const parts = pathname.split('/').filter(Boolean)
  const withLocale = parts[0] === 'pt' || parts[0] === 'en'
  const [locale, p, ...slug] = withLocale ? parts : [visitorLocale, ...parts]
  if (p !== 'p' || slug.length === 0) return null
  return `/${locale}/projetos/${slug.join('/').toLowerCase()}`
}
