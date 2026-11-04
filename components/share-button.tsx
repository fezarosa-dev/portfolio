'use client'

import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'

// compartilha o link curto (/p/<slug>): share sheet nativo no celular, copia no desktop
export function ShareButton({ slug, title, label, copiedLabel }: {
  slug: string
  title: string
  label: string
  copiedLabel: string
}) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = `${location.protocol}//${location.host.replace(/^www\./, '')}/p/${slug}`
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt(label, url)
    }
  }

  const Icon = copied ? Check : Share2
  return (
    <button
      type="button"
      onClick={share}
      aria-live="polite"
      className="tap-target inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-2.5 text-sm text-steel hover:border-signal hover:text-signal"
    >
      <Icon aria-hidden className="h-4 w-4" />
      {copied ? copiedLabel : label}
    </button>
  )
}
