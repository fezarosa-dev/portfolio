import { NextResponse } from 'next/server'
import { countRecentSearchesFromIp, logSearchRequest } from '@/lib/supabase/queries'
import { getSiteContent } from '@/lib/supabase/queries-cached'
import { searchFullText, searchSemantic } from '@/lib/supabase/search-queries'
import { reciprocalRankFusion } from '@/lib/search/rank'

const DEFAULTS = {
  rateLimitMax: 20,
  rateLimitWindowMinutes: 1,
  maxQueryLength: 200,
  semanticTimeoutMs: 4000,
  resultsLimit: 8,
}

function numberFromContent(content: Record<string, string>, key: string, fallback: number): number {
  const parsed = Number(content[key])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

export async function POST(request: Request) {
  const [body, content] = await Promise.all([
    request.json().catch(() => ({})),
    getSiteContent(),
  ])
  const query = String((body ?? {}).query ?? '').trim()

  const RATE_LIMIT_MAX = numberFromContent(content, 'search_rate_limit_max', DEFAULTS.rateLimitMax)
  const RATE_LIMIT_WINDOW_MINUTES = numberFromContent(
    content,
    'search_rate_limit_window_minutes',
    DEFAULTS.rateLimitWindowMinutes
  )
  const MAX_QUERY_LENGTH = numberFromContent(content, 'search_max_query_length', DEFAULTS.maxQueryLength)
  const SEMANTIC_TIMEOUT_MS = numberFromContent(content, 'search_semantic_timeout_ms', DEFAULTS.semanticTimeoutMs)
  const RESULTS_LIMIT = numberFromContent(content, 'search_results_limit', DEFAULTS.resultsLimit)

  if (!query) return NextResponse.json({ results: [] })
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: 'Busca muito longa.' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  // ponytail: sem x-forwarded-for o rate limit é pulado (confiamos que o proxy
  // de deploy sempre define esse header). Upgrade se precisar de robustez: usar
  // algum identificador de fallback (ex. fingerprint de request) quando ausente.
  if (ip) {
    const recentCount = await countRecentSearchesFromIp(ip, RATE_LIMIT_WINDOW_MINUTES)
    if (recentCount >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: 'Muitas buscas em pouco tempo. Tente de novo em instantes.' },
        { status: 429 }
      )
    }
    await logSearchRequest(ip)
  }

  let fullTextResults, semanticResults
  try {
    ;[fullTextResults, semanticResults] = await Promise.all([
      searchFullText(query),
      withTimeout(searchSemantic(query).catch(() => null), SEMANTIC_TIMEOUT_MS),
    ])
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar.' }, { status: 500 })
  }

  const results = semanticResults
    ? reciprocalRankFusion(fullTextResults, semanticResults)
    : fullTextResults

  return NextResponse.json({ results: results.slice(0, RESULTS_LIMIT) })
}
