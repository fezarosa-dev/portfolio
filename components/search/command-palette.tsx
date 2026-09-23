'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { SearchPanel } from '@/components/search/search-panel'
import type { Locale } from '@/lib/i18n'

export function CommandPalette({
  locale,
  placeholder,
  noResultsLabel,
  title,
}: {
  locale: Locale
  placeholder: string
  noResultsLabel: string
  title: string
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/search/warmup', { method: 'POST' }).catch(() => {})
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (!isShortcut) return
      event.preventDefault()
      setOpen((prev) => !prev)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[80vh] overflow-x-hidden overflow-y-auto pt-10 sm:max-w-lg">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <SearchPanel
          locale={locale}
          placeholder={placeholder}
          noResultsLabel={noResultsLabel}
          autoFocus
          onNavigate={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
