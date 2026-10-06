'use client'

import { setHandoff } from '@/lib/handoff'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ScrollArea } from '@/components/scroll-area'
import { ArrowUpRight, FileText, FolderGit2, SearchIcon, UserRound, XIcon } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { iconUrl } from '@/lib/icons'
import { resolveText } from '@/lib/bilingual'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
  projects: { id: string; title: string | null; title_en: string | null }[]
}

const TEXTS = {
  pt: { goTo: 'ir para', techs: 'tecnologias mais usadas', clear: 'Limpar busca',
    found: (n: number) => (n === 1 ? '1 resultado encontrado' : `${n} resultados encontrados`), navigate: 'navegar', open: 'abrir', close: 'fechar' },
  en: { goTo: 'go to', techs: 'most used technologies', clear: 'Clear search',
    found: (n: number) => (n === 1 ? '1 result found' : `${n} results found`), navigate: 'navigate', open: 'open', close: 'close' },
} as const

function resultIcon(url: string) {
  if (url.includes('/projetos')) return FolderGit2
  if (url.includes('/artigos') || url.includes('/curriculo')) return FileText
  if (url.includes('/sobre')) return UserRound
  return ArrowUpRight
}

export function SearchPanel({
  locale,
  placeholder,
  noResultsLabel,
  autoFocus = false,
  onNavigate,
  quickLinks,
  showHints = false,
}: {
  locale: Locale
  placeholder: string
  noResultsLabel: string
  autoFocus?: boolean
  onNavigate?: () => void
  /** atalhos pras páginas do site, mostrados com a busca vazia */
  quickLinks?: { href: string; label: string }[]
  /** dicas de teclado no rodapé (só no painel modal) */
  showHints?: boolean
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [techStats, setTechStats] = useState<TechStat[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([])
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(0)
  }, [results])

  useEffect(() => {
    linkRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      linkRefs.current[activeIndex]?.click()
    }
  }

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

  const t = TEXTS[locale]
  const trimmedQuery = query.trim()
  // a lista de tecnologias fica sempre montada (só escondida com `invisible`)
  // pra reservar a altura com base na qtde de tecnologias -- é isso que
  // define o tamanho da caixa; erro/sem resultado/resultados entram por
  // cima, num overlay absoluto do mesmo tamanho, com scroll interno se
  // precisar, em vez de crescer/encolher a caixa a cada estado
  const showTechStats = techStats.length > 0 && (!trimmedQuery || loading)
  const showError = trimmedQuery && !loading && Boolean(error)
  const showNoResults = trimmedQuery && !loading && !error && results.length === 0
  const showResults = trimmedQuery && !loading && !error && results.length > 0

  return (
    <div>
      <div className="relative">
        <SearchIcon aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-hairline bg-background pl-10 pr-10 font-mono text-sm outline-none transition-[border-color,box-shadow] placeholder:text-steel/70 focus:border-signal focus:ring-4 focus:ring-signal/15"
        />
        {query && (
          <button
            type="button"
            aria-label={t.clear}
            onClick={() => {
              handleQueryChange('')
              inputRef.current?.focus()
            }}
            className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-steel transition-colors hover:bg-signal/10 hover:text-signal"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      {!trimmedQuery && quickLinks && quickLinks.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-mono text-[11px] text-steel">{t.goTo}</span>
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className="rounded-full border border-hairline bg-card/70 px-2.5 py-1 text-xs text-foreground/80 transition-[border-color,color,transform] duration-150 hover:-translate-y-0.5 hover:border-signal hover:text-signal"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
      <div className="mt-3">
        {/* altura reservada mesmo sem carregar, pra não empurrar o resto ao aparecer/sumir */}
        <div className="flex h-8 items-center justify-center gap-1.5" aria-hidden={!loading && !showResults}>
          {showResults && (
            <p className="font-mono text-[11px] text-steel animate-in fade-in-0 duration-200" aria-live="polite">
              {t.found(results.length)}
            </p>
          )}
          {loading && (
            <>
              <span className="h-2 w-2 animate-bounce-dot rounded-full bg-signal" />
              <span className="h-2 w-2 animate-bounce-dot rounded-full bg-signal/75 [animation-delay:0.16s]" />
              <span className="h-2 w-2 animate-bounce-dot rounded-full bg-signal/55 [animation-delay:0.32s]" />
              <span className="h-2 w-2 animate-bounce-dot rounded-full bg-signal/35 [animation-delay:0.48s]" />
            </>
          )}
        </div>
        <div className="relative">
          <div className={showTechStats ? '' : 'invisible'} aria-hidden={!showTechStats}>
            <p className="mb-2 font-mono text-[11px] text-steel">{t.techs}</p>
            <TooltipProvider>
              <ScrollArea scrollerClassName="max-h-72">
              <ul className="flex flex-col gap-2">
                {techStats.map((stat) => {
                  const projectLinks = stat.projects
                    .map((project) => ({
                      id: project.id,
                      name: resolveText(project.title, project.title_en, locale),
                    }))
                    .filter((project) => Boolean(project.name))
                  return (
                    <li key={stat.id} className="flex items-center gap-2">
                      <Link
                        href={`/${locale}/projetos`}
                        title={`Ver projetos com ${stat.name}`}
                        onClick={() => {
                          setHandoff('tech', [stat.id])
                          onNavigate?.()
                        }}
                        className="flex w-24 shrink-0 items-center gap-1.5 transition-colors hover:text-signal"
                      >
                        {stat.devicon_slug && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={iconUrl(stat.devicon_slug, stat.devicon_variant ?? 'plain', stat.icon_source)}
                            alt=""
                            className="h-4 w-4 shrink-0"
                          />
                        )}
                        <span className="truncate font-mono text-xs text-foreground">{stat.name}</span>
                      </Link>
                      <Tooltip>
                        <TooltipTrigger
                          type="button"
                          className="h-1.5 flex-1 overflow-hidden rounded-full bg-hairline"
                          aria-label={`Projetos com ${stat.name}: ${projectLinks.map((p) => p.name).join(', ')}`}
                        >
                          <div className="h-full rounded-full bg-signal" style={{ width: `${stat.percentage}%` }} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="mb-1 font-mono font-medium text-foreground">{stat.name}</p>
                          <ul className="flex flex-col gap-0.5 text-steel">
                            {projectLinks.map((project) => (
                              <li key={project.id} className="truncate">
                                <Link
                                  href={`/${locale}/projetos/${project.id}`}
                                  onClick={onNavigate}
                                  className="transition-colors hover:text-signal hover:underline"
                                >
                                  {project.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                      <span className="w-8 shrink-0 text-right font-mono text-[10px] text-steel">
                        {stat.percentage}%
                      </span>
                    </li>
                  )
                })}
              </ul>
              </ScrollArea>
            </TooltipProvider>
          </div>
          {!showTechStats && (
            <ScrollArea className="absolute inset-0" scrollerClassName="h-full">
              {showError && <p className="font-mono text-xs text-steel">{error}</p>}
              {showNoResults && <p className="font-mono text-xs text-steel">{noResultsLabel}</p>}
              {showResults && (
                <ul className="flex flex-col gap-1">
                  {results.map((result, index) => {
                    const isExternal = result.url.startsWith('http')
                    const Icon = resultIcon(result.url)
                    const active = index === activeIndex
                    return (
                      <li
                        key={result.id}
                        className="min-w-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-200 fill-mode-both"
                        style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
                      >
                        <Link
                          ref={(el) => {
                            linkRefs.current[index] = el
                          }}
                          href={isExternal ? result.url : `/${locale}${result.url.split('?')[0]}`}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                          onClick={() => {
                            const tech = new URLSearchParams(result.url.split('?')[1]).get('tech')
                            if (tech) setHandoff('tech', [tech])
                            onNavigate?.()
                          }}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                            active ? 'border-signal/50 bg-signal/5' : 'border-transparent'
                          }`}
                        >
                          <span
                            className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md transition-colors ${
                              active ? 'bg-signal text-primary-foreground' : 'bg-signal/10 text-signal'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 block font-mono text-sm text-foreground">{result.title}</span>
                            {result.excerpt && (
                              <span className="line-clamp-2 block text-xs text-steel">{result.excerpt}</span>
                            )}
                          </span>
                          <ArrowUpRight
                            className={`mt-1 h-4 w-4 shrink-0 text-signal transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}
                          />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </ScrollArea>
          )}
        </div>
      </div>
      {showHints && (
        <div className="mt-4 flex items-center justify-center gap-4 border-t [@media(pointer:coarse)]:hidden border-hairline pt-3 font-mono text-[11px] text-steel">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-hairline bg-background px-1.5 py-0.5">↑</kbd>
            <kbd className="rounded border border-hairline bg-background px-1.5 py-0.5">↓</kbd>
            {t.navigate}
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-hairline bg-background px-1.5 py-0.5">↵</kbd>
            {t.open}
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-hairline bg-background px-1.5 py-0.5">esc</kbd>
            {t.close}
          </span>
        </div>
      )}
    </div>
  )
}
