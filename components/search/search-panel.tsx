'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Locale } from '@/lib/i18n'
import { iconUrl } from '@/lib/icons'

type SearchResult = {
  id: string
  title: string
  excerpt: string
  url: string
}

type TechStat = {
  id: string
  name: string
  devicon_slug: string | null
  devicon_variant: string | null
  icon_source: string | null
  percentage: number
}

export function SearchPanel({
  locale,
  placeholder,
  noResultsLabel,
  autoFocus = false,
  onNavigate,
}: {
  locale: Locale
  placeholder: string
  noResultsLabel: string
  autoFocus?: boolean
  onNavigate?: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [techStats, setTechStats] = useState<TechStat[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const requestIdRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    fetch('/api/search/tech-stats')
      .then((res) => res.json())
      .then((data) => setTechStats(Array.isArray(data.stats) ? data.stats : []))
      .catch(() => setTechStats([]))
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleQueryChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = value.trim()
    if (!trimmed) {
      setResults([])
      setError(null)
      setLoading(false)
      return
    }

    const requestId = ++requestIdRef.current
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })
        .then(async (res) => ({ ok: res.ok, data: await res.json() }))
        .then(({ ok, data }) => {
          if (requestId !== requestIdRef.current) return
          if (!ok) {
            setResults([])
            setError(typeof data.error === 'string' ? data.error : null)
            return
          }
          setError(null)
          setResults(Array.isArray(data.results) ? data.results : [])
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return
          setResults([])
          setError(null)
        })
        .finally(() => {
          if (requestId !== requestIdRef.current) return
          setLoading(false)
        })
    }, 300)
  }

  const trimmedQuery = query.trim()

  return (
    <div>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-hairline bg-background px-3 py-2 text-sm font-mono"
      />
      <div className="mt-3">
        {trimmedQuery && loading && <p className="font-mono text-xs text-steel">…</p>}
        {trimmedQuery && !loading && error && <p className="font-mono text-xs text-steel">{error}</p>}
        {trimmedQuery && !loading && !error && results.length === 0 && (
          <p className="font-mono text-xs text-steel">{noResultsLabel}</p>
        )}
        {!trimmedQuery && techStats.length > 0 && (
          <ul className="flex flex-col gap-2">
            {techStats.map((stat) => (
              <li key={stat.id} className="flex items-center gap-2">
                {stat.devicon_slug && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={iconUrl(stat.devicon_slug, stat.devicon_variant ?? 'plain', stat.icon_source)}
                    alt=""
                    className="h-3.5 w-3.5 shrink-0"
                  />
                )}
                <span className="w-20 shrink-0 truncate font-mono text-xs text-foreground">{stat.name}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-hairline">
                  <div className="h-full rounded-full bg-signal" style={{ width: `${stat.percentage}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-[10px] text-steel">
                  {stat.percentage}%
                </span>
              </li>
            ))}
          </ul>
        )}
        <ul className="flex flex-col gap-1">
          {trimmedQuery && results.map((result) => {
            const isExternal = result.url.startsWith('http')
            return (
              <li key={result.id}>
                <Link
                  href={isExternal ? result.url : `/${locale}${result.url}`}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  onClick={onNavigate}
                  className="block rounded-md px-3 py-2 transition-colors hover:bg-card"
                >
                  <p className="font-mono text-sm text-foreground">{result.title}</p>
                  {result.excerpt && <p className="truncate text-xs text-steel">{result.excerpt}</p>}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
