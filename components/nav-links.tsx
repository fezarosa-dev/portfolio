'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

// a home é `/pt`, então só ela casa por igualdade; as demais casam por prefixo (ex.: /pt/projetos/abc → Projetos)
export function isActiveLink(pathname: string, href: string, isHome: boolean) {
  return isHome ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

// Links do menu de cima com a aba atual marcada: texto laranja e uma barrinha que desliza
// de uma aba pra outra (layoutId) ao navegar.
export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname()

  return (
    <ul className="hidden gap-5 text-sm md:flex md:gap-7">
      {links.map((link, i) => {
        const active = isActiveLink(pathname, link.href, i === 0)
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`relative transition-colors hover:text-signal ${
                active ? 'font-medium text-signal' : 'text-foreground/80'
              }`}
            >
              {link.label}
              {active && (
                <motion.span
                  layoutId="nav-active"
                  aria-hidden
                  className="absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-signal"
                  transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                />
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
