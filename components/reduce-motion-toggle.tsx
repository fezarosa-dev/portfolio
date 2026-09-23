'use client'

import { useReduceMotion } from '@/components/reduce-motion-provider'
import type { Locale } from '@/lib/i18n/dictionaries'

export function ReduceMotionToggle({ locale }: { locale: Locale }) {
  const { enabled, toggle } = useReduceMotion()
  const label = locale === 'en' ? 'Reduce animations' : 'Reduzir animações'

  return (
    <label className="motion-switch" title={label} aria-label={label}>
      <input type="checkbox" checked={enabled} onChange={toggle} />
      <span className="motion-switch-slider">
        <span className="motion-switch-thumb">
          <svg className="motion-switch-icon motion-switch-on" viewBox="0 0 130.2 130.2" aria-hidden>
            <polyline className="path" points="100.2,40.2 51.5,88.8 29.8,67.5" />
          </svg>
          <svg className="motion-switch-icon motion-switch-off" viewBox="0 0 130.2 130.2" aria-hidden>
            <line className="path" x1="34.4" y1="34.4" x2="95.8" y2="95.8" />
            <line className="path" x1="95.8" y1="34.4" x2="34.4" y2="95.8" />
          </svg>
        </span>
      </span>
    </label>
  )
}
