import Link from 'next/link'
import { cookies } from 'next/headers'
import { getSiteContent } from '@/lib/supabase/queries-cached'
import { getDictionary } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { NavLinks } from '@/components/nav-links'
import { MobileNav } from '@/components/mobile-nav'
import { NavSettings } from '@/components/nav-settings'
import { SearchPill } from '@/components/search/search-trigger'
import { CollapsibleOnScroll } from '@/components/collapsible-on-scroll'

const STATUS_COLORS: Record<string, string> = {
  green: '#2FAE66',
  amber: '#F2661D',
  red: '#E5484D',
  gray: '#6B7280',
}

export async function Nav() {
  const [content, { locale, dict }, cookieStore] = await Promise.all([
    getSiteContent(),
    getDictionary(),
    cookies(),
  ])
  const isDark = cookieStore.get('theme')?.value === 'dark'
  const statusText = resolveText(
    content.status_text || 'disponível para novos projetos',
    content.status_text_en,
    locale
  )
  const statusColor = STATUS_COLORS[content.status_color] ?? STATUS_COLORS.green
  const hiddenLinks = new Set(
    (content.nav_hidden_links ?? '')
      .split(',')
      .map((href) => href.trim())
      .filter(Boolean)
  )
  const navLinks = dict.nav.links
    .filter((link) => !hiddenLinks.has(link.href))
    .map((link) => ({ ...link, href: `/${locale}${link.href === '/' ? '' : link.href}` }))
  const easterEggsAtivo = content.easter_eggs_ativo !== 'false'

  return (
    <div className="sticky top-0 z-40 border-b border-hairline bg-background/80 backdrop-blur">
      <CollapsibleOnScroll className="hidden md:grid">
        <div className="flex items-center gap-2 border-b border-hairline px-6 py-1.5 font-mono text-[11px] text-steel">
          <span
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: statusColor }}
            aria-hidden
          />
          <span className="truncate">{statusText}</span>
          <span className="ml-auto flex items-center gap-2">
            <NavSettings
              initialDark={isDark}
              locale={locale}
              label={dict.nav.settings}
              easterEggsAtivo={easterEggsAtivo}
            />
          </span>
        </div>
      </CollapsibleOnScroll>
      <nav className="relative flex items-center justify-between px-6 py-4">
        <Link
          href={`/${locale}`}
          aria-label="zanoni.dev.br"
          className="logo-link font-mono text-sm font-medium tracking-tight"
        >
          <span aria-hidden>
            {[...'zanoni.dev.br'].map((letter, i) => (
              <span
                key={i}
                className={`logo-letter${i >= 6 ? ' text-signal' : ''}`}
                style={{ '--i': i } as React.CSSProperties}
              >
                {letter}
              </span>
            ))}
            <span className="logo-caret" />
          </span>
        </Link>
        <SearchPill label={dict.busca.title} className="hidden md:flex md:min-w-36 lg:min-w-48 xl:absolute xl:left-1/2 xl:-translate-x-1/2" />
        <NavLinks links={navLinks} />
        <MobileNav
          links={navLinks}
          openLabel={dict.nav.menuOpen}
          closeLabel={dict.nav.menuClose}
          settingsLabel={dict.nav.settings}
          searchLabel={dict.busca.title}
          initialDark={isDark}
          locale={locale}
          easterEggsAtivo={easterEggsAtivo}
        />
      </nav>
    </div>
  )
}
