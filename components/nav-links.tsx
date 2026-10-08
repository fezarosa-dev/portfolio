'use client'

import Link from 'next/link'
import { useLayoutEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { RollText } from '@/components/roll-text'

// a home é `/pt`, então só ela casa por igualdade; as demais casam por prefixo (ex.: /pt/projetos/abc → Projetos)
export function isActiveLink(pathname: string, href: string, isHome: boolean) {
  return isHome ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

type Rect = { left: number; width: number }

// Links do menu de cima. Aba atual: texto laranja e uma barrinha que desliza (devagar) de uma aba
// pra outra ao navegar. Hover: uma pílula suave que segue o mouse de um link pro outro.
// As duas são medidas a partir dos <li> e animadas com transition de CSS (o layoutId do Framer
// Motion não estava animando entre rotas: a barra pulava direto pro destino).
export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname()
  const listRef = useRef<HTMLUListElement>(null)
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({})
  const [bar, setBar] = useState<Rect | null>(null)
  const [pill, setPill] = useState<(Rect & { visible: boolean }) | null>(null)

  const activeHref = links.find((link, i) => isActiveLink(pathname, link.href, i === 0))?.href

  const measure = (href: string | undefined): Rect | null => {
    const el = href ? itemRefs.current[href] : null
    return el && el.offsetWidth ? { left: el.offsetLeft, width: el.offsetWidth } : null
  }

  useLayoutEffect(() => {
    const update = () => setBar(measure(activeHref))
    update()
    // recalcula quando a lista muda de tamanho (fonte carregando, redimensionar a janela, sair do display:none)
    const observer = new ResizeObserver(update)
    if (listRef.current) observer.observe(listRef.current)
    return () => observer.disconnect()
  }, [activeHref])

  const showPill = (href: string) => {
    const rect = measure(href)
    if (rect) setPill({ ...rect, visible: true })
  }

  return (
    <ul
      ref={listRef}
      className="relative hidden gap-1 text-sm md:flex"
      onMouseLeave={() => setPill((p) => (p ? { ...p, visible: false } : p))}
    >
      {pill && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 rounded-full bg-signal/10 transition-[left,width,opacity] duration-300 ease-out"
          style={{ left: pill.left, width: pill.width, opacity: pill.visible ? 1 : 0 }}
        />
      )}
      {links.map((link, i) => {
        const active = isActiveLink(pathname, link.href, i === 0)
        return (
          <li
            key={link.href}
            ref={(el) => {
              itemRefs.current[link.href] = el
            }}
          >
            <Link
              href={link.href}
              aria-current={active ? 'page' : undefined}
              onMouseEnter={() => showPill(link.href)}
              onFocus={() => showPill(link.href)}
              onBlur={() => setPill((p) => (p ? { ...p, visible: false } : p))}
              className={`relative block px-3 py-1.5 transition-colors hover:text-signal ${
                active ? 'font-medium text-signal' : 'text-foreground/80'
              }`}
            >
              <RollText>{link.label}</RollText>
            </Link>
          </li>
        )
      })}
      {bar && (
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-0.5 h-0.5 rounded-full bg-signal transition-[left,width] duration-500 ease-in-out"
          style={{ left: bar.left + 12, width: bar.width - 24 }}
        />
      )}
    </ul>
  )
}
