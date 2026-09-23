'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@/lib/i18n/dictionaries'

export function ThemeToggle({ initialDark, locale }: { initialDark: boolean; locale: Locale }) {
  const [dark, setDark] = useState(initialDark)

  useEffect(() => {
    // syncs with the beforeInteractive script that applies prefers-color-scheme
    // when there's no theme cookie yet, so the checkbox matches the real class
    const actual = document.documentElement.classList.contains('dark')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (actual !== dark) setDark(actual)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const label = locale === 'en' ? 'Toggle dark mode' : 'Alternar modo escuro'

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    document.cookie = `theme=${next ? 'dark' : 'light'}; path=/; max-age=${60 * 60 * 24 * 365}`
  }

  return (
    <label className="theme-switch" title={label} aria-label={label}>
      <input type="checkbox" checked={dark} onChange={toggle} />
      <span className="theme-switch-slider">
        <span className="theme-switch-sun-moon">
          <span className="theme-switch-moon-dot theme-switch-moon-dot-1" />
          <span className="theme-switch-moon-dot theme-switch-moon-dot-2" />
          <span className="theme-switch-moon-dot theme-switch-moon-dot-3" />
          <span className="theme-switch-light-ray theme-switch-light-ray-1" />
          <span className="theme-switch-light-ray theme-switch-light-ray-2" />
          <span className="theme-switch-light-ray theme-switch-light-ray-3" />
        </span>
        <span aria-hidden>
          <span className="theme-switch-cloud theme-switch-cloud-dark theme-switch-cloud-1" />
          <span className="theme-switch-cloud theme-switch-cloud-dark theme-switch-cloud-2" />
          <span className="theme-switch-cloud theme-switch-cloud-dark theme-switch-cloud-3" />
          <span className="theme-switch-cloud theme-switch-cloud-light theme-switch-cloud-4" />
          <span className="theme-switch-cloud theme-switch-cloud-light theme-switch-cloud-5" />
          <span className="theme-switch-cloud theme-switch-cloud-light theme-switch-cloud-6" />
        </span>
        <span className="theme-switch-stars" aria-hidden>
          <svg className="theme-switch-star theme-switch-star-1" viewBox="0 0 20 20">
            <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
          </svg>
          <svg className="theme-switch-star theme-switch-star-2" viewBox="0 0 20 20">
            <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
          </svg>
          <svg className="theme-switch-star theme-switch-star-3" viewBox="0 0 20 20">
            <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
          </svg>
          <svg className="theme-switch-star theme-switch-star-4" viewBox="0 0 20 20">
            <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
          </svg>
        </span>
      </span>
    </label>
  )
}
