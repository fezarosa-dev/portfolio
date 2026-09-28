'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Menu de navegação fixo na lateral esquerda (só em telas largas, xl+, onde sobra espaço
// ao lado do conteúdo, que tem no máximo max-w-4xl). Linha vertical com marcador laranja
// na página atual. Abaixo de xl os links ficam na barra de cima (ver components/nav.tsx).
export function SideNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname()
  // a home é `/pt`, então só ela pode casar por igualdade; as demais casam por prefixo
  const isActive = (href: string, i: number) => (i === 0 ? pathname === href : pathname.startsWith(href))

  return (
    <nav aria-label="Principal" className="fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 xl:block">
      <ul className="flex flex-col border-l border-hairline">
        {links.map((link, i) => {
          const active = isActive(link.href, i)
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`-ml-px block border-l-2 py-1.5 pl-4 pr-3 text-sm transition-[color,border-color,padding] duration-200 ease-out hover:pl-5 motion-reduce:transition-none ${
                  active
                    ? 'border-signal font-medium text-signal'
                    : 'border-transparent text-foreground/70 hover:border-signal/50 hover:text-signal'
                }`}
              >
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
