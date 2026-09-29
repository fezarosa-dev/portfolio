'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

// a home é `/pt`, então só ela casa por igualdade; as demais casam por prefixo (ex.: /pt/projetos/abc → Projetos)
export function isActiveLink(pathname: string, href: string, isHome: boolean) {
  return isHome ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

// Links do menu de cima. Aba atual: texto laranja e uma barrinha que desliza de uma aba pra
// outra ao navegar. Hover: uma pílula suave que segue o mouse de um link pro outro e some ao sair.
export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname()
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <ul className="hidden gap-1 text-sm md:flex" onMouseLeave={() => setHovered(null)}>
      {links.map((link, i) => {
        const active = isActiveLink(pathname, link.href, i === 0)
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? 'page' : undefined}
              onMouseEnter={() => setHovered(link.href)}
              onFocus={() => setHovered(link.href)}
              onBlur={() => setHovered(null)}
              className={`relative block px-3 py-1.5 transition-colors hover:text-signal ${
                active ? 'font-medium text-signal' : 'text-foreground/80'
              }`}
            >
              {hovered === link.href && (
                <motion.span
                  layoutId="nav-hover"
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-full bg-signal/10"
                  transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                />
              )}
              {link.label}
              {active && (
                <motion.span
                  layoutId="nav-active"
                  aria-hidden
                  className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-signal"
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
