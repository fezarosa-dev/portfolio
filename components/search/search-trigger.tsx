'use client'

import { SearchIcon } from 'lucide-react'

const OPEN_SEARCH_EVENT = 'zanoni:open-search'

export function SearchTrigger({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-hairline text-steel transition-colors hover:border-signal hover:text-signal"
    >
      <SearchIcon className="h-3.5 w-3.5" aria-hidden />
    </button>
  )
}

export { OPEN_SEARCH_EVENT }
