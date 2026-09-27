'use client'

import { useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { motion } from 'framer-motion'
import { SettingsIcon } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitch } from '@/components/language-switch'
import { ReduceMotionToggle } from '@/components/reduce-motion-toggle'
import { KonamiAdmin } from '@/components/konami-admin'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import type { Locale } from '@/lib/i18n/dictionaries'

export function NavSettings({
  initialDark,
  locale,
  label,
  easterEggsAtivo = true,
}: {
  initialDark: boolean
  locale: Locale
  label: string
  easterEggsAtivo?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { enabled: reduceMotion } = useReduceMotion()

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {easterEggsAtivo && <KonamiAdmin active={open} />}
      <Popover.Trigger
        aria-label={label}
        title={label}
        className="group flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-hairline text-steel transition-colors hover:border-signal hover:text-signal aria-expanded:border-signal aria-expanded:text-signal"
      >
        <motion.span
          className="flex"
          animate={reduceMotion ? undefined : { rotate: open ? 360 : 0 }}
          whileHover={reduceMotion || open ? undefined : { rotate: 45 }}
          transition={
            reduceMotion
              ? undefined
              : open
                ? { duration: 1.1, repeat: Infinity, ease: 'linear' }
                : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <SettingsIcon className="h-3.5 w-3.5" aria-hidden />
        </motion.span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <Popover.Popup className="flex flex-col gap-3 rounded-lg border border-hairline bg-card p-3 shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <ThemeToggle initialDark={initialDark} locale={locale} />
            <ReduceMotionToggle locale={locale} />
            <div className="h-px bg-hairline" aria-hidden />
            <LanguageSwitch locale={locale} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
