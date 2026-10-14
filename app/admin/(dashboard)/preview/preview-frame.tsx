'use client'

import { useEffect, useState } from 'react'
import { useChanges } from '@/components/admin/changes-provider'

type Device = 'desktop' | 'tablet' | 'mobile'

const WIDTHS: Record<Device, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
}

export function PreviewFrame() {
  const [locale, setLocale] = useState<'pt' | 'en'>('pt')
  const [device, setDevice] = useState<Device>('desktop')
  const [nonce, setNonce] = useState(0)
  const { changes, loaded } = useChanges()
  const signature = changes.map((c) => c.id).join()

  useEffect(() => {
    // a fila mudou: espera o rascunho ser gravado (~700ms) e recarrega o site embutido
    if (!loaded) return
    const timer = setTimeout(() => setNonce((n) => n + 1), 1500)
    return () => clearTimeout(timer)
  }, [signature, loaded])

  const src = `/${locale}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
        <div className="flex overflow-hidden rounded-md border border-hairline">
          {(['pt', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              aria-pressed={locale === l}
              className={`px-3 py-1 uppercase ${locale === l ? 'bg-signal text-white' : 'text-steel hover:text-signal'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-md border border-hairline">
          {(['desktop', 'tablet', 'mobile'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              aria-pressed={device === d}
              className={`px-3 py-1 capitalize ${device === d ? 'bg-signal text-white' : 'text-steel hover:text-signal'}`}
            >
              {d}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          className="rounded-md border border-hairline px-3 py-1 text-steel hover:text-signal"
        >
          ⟳ Recarregar
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-hairline px-3 py-1 text-steel hover:text-signal"
        >
          ⧉ Nova aba
        </a>
      </div>

      <div className="flex justify-center overflow-auto rounded-lg border border-hairline bg-card p-4">
        <iframe
          key={`${locale}-${nonce}`}
          src={src}
          title="Preview do site"
          className="h-[80vh] rounded-md border border-hairline bg-background"
          style={{ width: WIDTHS[device], maxWidth: '100%' }}
        />
      </div>
    </div>
  )
}
