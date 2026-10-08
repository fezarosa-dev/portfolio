'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/scroll-area'
import { iconUrl } from '@/lib/icons'
import type { Language } from '@/lib/supabase/queries'

export function TechCombobox({
  languages,
  onSelect,
  placeholder,
}: {
  languages: Language[]
  onSelect: (language: Language) => void
  placeholder: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const matches = languages.filter((lang) => lang.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-md border border-hairline bg-background px-3 py-2 text-sm sm:w-56"
      />
      {open && matches.length > 0 && (
        <ScrollArea
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-hairline bg-card py-1 shadow-lg sm:w-56"
          scrollerClassName="max-h-64"
        >
          <ul>
            {matches.map((lang) => (
              <li key={lang.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(lang)
                    setQuery('')
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-signal"
                >
                  {lang.devicon_slug && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={iconUrl(lang.devicon_slug, lang.devicon_variant ?? 'plain', lang.icon_source)}
                      alt=""
                      className="h-4 w-4"
                    />
                  )}
                  {lang.name}
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  )
}
