'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { NavSettings } from '@/components/nav-settings'
import { SearchTrigger } from '@/components/search/search-trigger'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import type { Locale } from '@/lib/i18n/dictionaries'

export function MobileNav({
  links,
  openLabel,
  closeLabel,
  settingsLabel,
  searchLabel,
  initialDark,
  locale,
}: {
  links: { href: string; label: string }[]
  openLabel: string
  closeLabel: string
  settingsLabel: string
  searchLabel: string
  initialDark: boolean
  locale: Locale
}) {
  const [open, setOpen] = useState(false)
  const { enabled: reduceMotion } = useReduceMotion()

  const items = (
    <>
      {links.map((link) => (
        <li key={link.href} className="border-b border-hairline">
          <Link
            href={link.href}
            onClick={() => setOpen(false)}
            className="block py-3 text-foreground/80 hover:text-signal"
          >
            {link.label}
          </Link>
        </li>
      ))}
      <li className="flex justify-end gap-2 py-3">
        <span onClick={() => setOpen(false)}>
          <SearchTrigger label={searchLabel} />
        </span>
        <NavSettings initialDark={initialDark} locale={locale} label={settingsLabel} />
      </li>
    </>
  )

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? closeLabel : openLabel}
        aria-expanded={open}
        className={`flex h-8 w-8 flex-col items-center justify-center gap-2 ${reduceMotion ? '' : 'transition-transform duration-300'} ${open ? 'rotate-90' : ''}`}
      >
        <span
          className={`h-0.5 w-5 origin-left bg-foreground ${reduceMotion ? '' : 'transition-transform duration-300'} ${open ? 'z-10 translate-y-5 rotate-[-60deg]' : ''}`}
        />
        <span
          className={`h-0.5 w-5 origin-right bg-foreground ${reduceMotion ? '' : 'transition-transform duration-300'} ${open ? 'z-20 translate-y-2.5 rotate-[60deg]' : ''}`}
        />
        <span className="h-0.5 w-5 bg-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full flex flex-col border-b border-hairline bg-background px-6 py-2"
          >
            {items}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
