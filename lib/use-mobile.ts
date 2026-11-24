'use client'

import { useSyncExternalStore } from 'react'

// celular = abaixo do "md" do Tailwind (768px). No servidor conta como desktop (a troca acontece na hidratação)
const QUERY = '(max-width: 767px)'

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
}
