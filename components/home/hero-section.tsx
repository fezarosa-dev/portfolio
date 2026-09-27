'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronDownIcon } from 'lucide-react'
import { iconUrl } from '@/lib/icons'
import { Typewriter } from '@/components/typewriter'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import type { Language } from '@/lib/supabase/queries'
import type { Locale } from '@/lib/i18n'

export function HeroSection({
  title,
  subtitle,
  languages,
  whoamiLabel,
  locale,
}: {
  title: string
  subtitle: string
  languages: Language[]
  whoamiLabel: string
  locale: Locale
}) {
  const { enabled: reduceMotion } = useReduceMotion()
  const noAnim = reduceMotion ? { duration: 0 } : undefined

  return (
    <section className="relative flex min-h-[62vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -3 }}
        whileHover={reduceMotion ? undefined : { rotate: 0, scale: 1.05 }}
        transition={noAnim ?? { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative inline-block"
      >
        <Link
          href={`/${locale}/sobre`}
          title="Sobre mim"
          className="inline-block rounded-md border-2 border-dashed border-signal/60 bg-card/70 px-3 py-1 font-mono text-sm text-signal transition-colors hover:border-signal"
        >
          {whoamiLabel}
        </Link>
      </motion.div>
      <motion.h1
        initial={reduceMotion ? false : { opacity: 0, y: 24, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={noAnim ?? { type: 'spring', stiffness: 140, damping: 14, delay: 0.1 }}
        className="relative mt-4 text-5xl font-medium tracking-tight sm:text-7xl [font-family:var(--font-hero)]"
      >
        {title}
      </motion.h1>
      <motion.svg
        aria-hidden
        viewBox="0 0 220 24"
        className="relative mt-1 h-6 w-40 overflow-visible text-signal sm:w-56"
        initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={noAnim ?? { duration: 0.7, delay: 0.55, ease: 'easeOut' }}
      >
        <motion.path
          d="M4 12c20-8 40 8 60 0s40-8 60 0 40 8 60 0 26-6 32-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </motion.svg>
      <motion.p
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={noAnim ?? { duration: 0.4, delay: 0.9 }}
        className="relative mt-5 max-w-xl text-xl text-steel"
      >
        <Typewriter text={subtitle} startDelay={900} />
      </motion.p>
      {languages.length > 0 && (
        <motion.ul
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={noAnim ?? { duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-8 flex flex-wrap justify-center gap-3"
        >
          {languages.map((lang, i) => (
            <motion.li
              key={lang.id}
              style={{ rotate: i % 2 === 0 ? -2 : 2 }}
              whileHover={reduceMotion ? undefined : { rotate: 0, scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <Link
                href={`/${locale}/projetos?tech=${lang.id}`}
                title={`Ver projetos com ${lang.name}`}
                className="flex items-center gap-1.5 rounded-full border border-hairline bg-card/70 px-3 py-1 font-mono text-xs text-steel shadow-sm transition-colors hover:border-signal hover:text-signal"
              >
                {lang.devicon_slug && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={iconUrl(lang.devicon_slug, lang.devicon_variant ?? 'plain', lang.icon_source)}
                    alt=""
                    className="h-4 w-4"
                  />
                )}
                {lang.name}
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={noAnim ?? { duration: 0.4, delay: 1.3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden
      >
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
          transition={reduceMotion ? undefined : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDownIcon className="h-6 w-6 text-steel" />
        </motion.div>
      </motion.div>
    </section>
  )
}
