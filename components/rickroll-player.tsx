'use client'

// never gonna give this repo up. clique 3x rápido no cachorro dormindo
// (components/mascote.tsx) pra ver isso ao vivo.
import { forwardRef, useState } from 'react'
import { createPortal } from 'react-dom'

// o vídeo do Drive é H.264 (High, 1080p) + AAC: navegadores sem decodificador H.264 (ex.: Firefox no
// Fedora/Linux sem codecs extras) dão "vídeo corrompido". Nesses casos toca a cópia em WebM (VP9 + Opus,
// 720p) que fica na mesma pasta do Drive (rickroll.webm), decodificada por qualquer navegador moderno.
const H264 = 'video/mp4; codecs="avc1.640028, mp4a.40.2"'

export const RickrollPlayer = forwardRef<
  HTMLVideoElement,
  { videoUrl: string; fallbackUrl: string | null; open: boolean; onClose: () => void }
>(function RickrollPlayer({ videoUrl, fallbackUrl, open, onClose }, ref) {
  // só renderiza no cliente (portal, depois do 1º clique), então `document` existe
  const [src] = useState(() => (fallbackUrl && !document.createElement('video').canPlayType(H264) ? fallbackUrl : videoUrl))

  // segunda rede de proteção: se o navegador disse que toca H.264 mas falhou ao decodificar
  function handleError(e: React.SyntheticEvent<HTMLVideoElement>) {
    const video = e.currentTarget
    if (!fallbackUrl || video.currentSrc.endsWith(fallbackUrl)) return
    video.src = fallbackUrl
    video.load()
    if (open) video.play().catch(() => {})
  }

  return createPortal(
    <div
      className={
        open ? 'fixed inset-0 z-[70] flex items-center justify-center bg-black' : 'hidden'
      }
    >
      <video
        ref={ref}
        src={src}
        preload="auto"
        controls
        playsInline
        onError={handleError}
        className="h-full w-full object-contain"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/20"
      >
        ×
      </button>
    </div>,
    document.body
  )
})
