'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/lib/i18n/dictionaries'

export function CookieConsentBanner({
  show,
  locale,
  message,
  acceptLabel,
  declineLabel,
  policyLinkLabel,
}: {
  show: boolean
  locale: Locale
  message: string
  acceptLabel: string
  declineLabel: string
  policyLinkLabel: string
}) {
  const router = useRouter()
  const [visible, setVisible] = useState(show)

  function respond(accepted: boolean) {
    document.cookie = `cookie-consent=${accepted ? 'accepted' : 'declined'}; path=/; max-age=${60 * 60 * 24 * 365}`
    setVisible(false)
    router.refresh()
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-card/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-center text-xs text-foreground/80 sm:text-left sm:text-sm">
          {message}{' '}
          <a href={`/${locale}/cookies`} className="text-signal hover:underline">
            {policyLinkLabel}
          </a>
        </p>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          <Button variant="outline" size="sm" className="h-10 flex-1 sm:h-7 sm:flex-none" onClick={() => respond(false)}>
            {declineLabel}
          </Button>
          <Button size="sm" className="h-10 flex-1 sm:h-7 sm:flex-none" onClick={() => respond(true)}>
            {acceptLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
