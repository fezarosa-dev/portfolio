'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'

const ReduceMotionContext = createContext<{ enabled: boolean; toggle: () => void }>({
  enabled: false,
  toggle: () => {},
})

export function useReduceMotion() {
  return useContext(ReduceMotionContext)
}

export function ReduceMotionProvider({
  initialEnabled,
  cookieSet,
  children,
}: {
  initialEnabled: boolean
  cookieSet: boolean
  children: React.ReactNode
}) {
  const [enabled, setEnabled] = useState(initialEnabled)

  useEffect(() => {
    if (cookieSet) return
    const osReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.documentElement.classList.toggle('reduce-motion', osReduce)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (osReduce !== enabled) setEnabled(osReduce)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggle() {
    const next = !enabled
    setEnabled(next)
    document.documentElement.classList.toggle('reduce-motion', next)
    document.cookie = `reduce-motion=${next}; path=/; max-age=${60 * 60 * 24 * 365}`
  }

  return (
    <ReduceMotionContext.Provider value={{ enabled, toggle }}>
      <MotionConfig reducedMotion={enabled ? 'always' : 'user'}>{children}</MotionConfig>
    </ReduceMotionContext.Provider>
  )
}
