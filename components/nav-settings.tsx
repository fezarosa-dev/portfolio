'use client'

import { useRef, useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { useAnimationFrame, useMotionValue } from 'framer-motion'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitch } from '@/components/language-switch'
import { ReduceMotionToggle } from '@/components/reduce-motion-toggle'
import { GearIcon } from '@/components/gear-train'
import { KonamiAdmin } from '@/components/konami-admin'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import type { Locale } from '@/lib/i18n/dictionaries'

// graus por segundo
const IDLE_SPEED = 30
const HOVER_SPEED = 160
const OPEN_SPEED = 220

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
  // giro da engrenagem (graus), contínuo: a velocidade sobe suavemente no hover e quando o menu está aberto
  const angle = useMotionValue(0)
  const speed = useRef(IDLE_SPEED)
  const hovered = useRef(false)
  const [hover, setHover] = useState(false)
  useAnimationFrame((_, delta) => {
    if (reduceMotion) return
    const target = open ? OPEN_SPEED : hovered.current ? HOVER_SPEED : IDLE_SPEED
    speed.current += (target - speed.current) * (1 - Math.exp(-delta / 250))
    angle.set(angle.get() + (speed.current * delta) / 1000)
  })

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {easterEggsAtivo && <KonamiAdmin active={open} />}
      <Popover.Trigger
        aria-label={label}
        title={label}
        onMouseEnter={() => {
          hovered.current = true
          setHover(true)
        }}
        onMouseLeave={() => {
          hovered.current = false
          setHover(false)
        }}
        className="group flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-hairline text-steel transition-colors hover:border-signal hover:text-signal aria-expanded:border-signal aria-expanded:text-signal"
      >
        <GearIcon angle={angle} meshed={hover || open} />
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
