'use client'

import { useCallback, useState } from 'react'

// Bolinha quicando numa gangorra (CSS em globals.css: .loader-ball) mostrada no lugar da
// imagem enquanto ela baixa. `useImageLoaded` cobre imagem que já veio do cache (complete
// antes do onLoad ser registrado).
export function ImageLoader({ className }: { className?: string }) {
  return <div role="status" aria-label="Carregando imagem" className={`loader-ball ${className ?? ''}`} />
}

export function useImageLoaded() {
  const [loaded, setLoaded] = useState(false)
  const ref = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete) setLoaded(true)
  }, [])
  return { loaded, ref, onLoad: () => setLoaded(true), onError: () => setLoaded(true) }
}
