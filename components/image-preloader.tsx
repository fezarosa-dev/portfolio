'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const CONCURRENCY = 2

// Baixa em segundo plano, depois que a página terminou de carregar, as imagens que o
// visitante provavelmente vai ver a seguir (foto do Sobre + imagens dos projetos), pra já
// estarem no cache do navegador quando ele abrir essas páginas. Uma a uma (CONCURRENCY em
// paralelo) e com prioridade baixa pra não competir com a página atual.
// A foto usa o mesmo <Image> da página Sobre (mesmas props => mesmo srcset => mesma URL em cache).
export function ImagePreloader({ photoUrl, urls }: { photoUrl: string | null; urls: string[] }) {
  const queue = photoUrl ? [photoUrl, ...urls] : urls
  const [count, setCount] = useState(0)

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection
    if (conn?.saveData || /2g/.test(conn?.effectiveType ?? '')) return

    const start = () => setCount(CONCURRENCY)
    const idle = () =>
      'requestIdleCallback' in window ? window.requestIdleCallback(start, { timeout: 4000 }) : setTimeout(start, 1500)
    if (document.readyState === 'complete') idle()
    else window.addEventListener('load', idle, { once: true })
    return () => window.removeEventListener('load', idle)
  }, [])

  const next = () => setCount((c) => c + 1)

  return (
    <div aria-hidden className="pointer-events-none fixed left-0 top-0 size-0 overflow-hidden opacity-0">
      {queue.slice(0, count).map((url, i) =>
        photoUrl && i === 0 ? (
          <Image key={url} src={url} alt="" width={256} height={256} fetchPriority="low" onLoad={next} onError={next} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={url} src={url} alt="" decoding="async" fetchPriority="low" onLoad={next} onError={next} />
        )
      )}
    </div>
  )
}
