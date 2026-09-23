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
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={noAnim ?? { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="font-mono text-sm text-signal"
      >
        {whoamiLabel}
      </motion.p>
      <motion.h1
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={noAnim ?? { duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3 text-5xl font-medium tracking-tight sm:text-7xl"
      >
        {title}
      </motion.h1>
      <motion.p
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={noAnim ?? { duration: 0.4, delay: 0.9 }}
        className="mt-4 max-w-xl text-xl text-steel"
      >
        <Typewriter text={subtitle} startDelay={900} />
      </motion.p>
      {languages.length > 0 && (
        <motion.ul
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={noAnim ?? { duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {languages.map((lang) => (
            <li key={lang.id}>
              <Link
                href={`/${locale}/projetos?tech=${lang.id}`}
                title={`Ver projetos com ${lang.name}`}
                className="flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1 font-mono text-xs text-steel transition-colors hover:border-signal hover:text-signal"
              >
                {lang.devicon_slug && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={iconUrl(lang.devicon_slug, lang.devicon_variant ?? 'plain', lang.icon_source)}
                    alt=""
                    className="h-3.5 w-3.5"
                  />
                )}
                {lang.name}
              </Link>
            </li>
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
