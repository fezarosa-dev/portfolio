import Link from 'next/link'
import { cookies } from 'next/headers'
import { getSiteContent } from '@/lib/supabase/queries-cached'
import { getDictionary } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { MobileNav } from '@/components/mobile-nav'
import { NavSettings } from '@/components/nav-settings'
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
  const navLinks = (
    content.artigos_ativo === 'false'
      ? dict.nav.links.filter((link) => link.href !== '/artigos')
      : dict.nav.links
  ).map((link) => ({ ...link, href: `/${locale}${link.href === '/' ? '' : link.href}` }))

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
          <span className="ml-auto flex items-center">
            <NavSettings initialDark={isDark} locale={locale} label={dict.nav.settings} />
          </span>
        </div>
      </CollapsibleOnScroll>
      <nav className="relative flex items-center justify-between px-6 py-4">
        <Link href={`/${locale}`} className="font-mono text-sm font-medium tracking-tight">
          zanoni<span className="text-signal">.dev.br</span>
        </Link>
        <ul className="hidden gap-5 text-sm md:flex md:gap-7">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-foreground/80 transition-colors hover:text-signal"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <MobileNav
          links={navLinks}
          openLabel={dict.nav.menuOpen}
          closeLabel={dict.nav.menuClose}
          settingsLabel={dict.nav.settings}
          initialDark={isDark}
          locale={locale}
        />
      </nav>
    </div>
  )
}
