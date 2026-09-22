import { NextResponse } from 'next/server'
import { countRecentSearchesFromIp, logSearchRequest } from '@/lib/supabase/queries'
import { searchFullText, searchSemantic } from '@/lib/supabase/search-queries'
import { reciprocalRankFusion } from '@/lib/search/rank'

const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MINUTES = 1
const MAX_QUERY_LENGTH = 200
const SEMANTIC_TIMEOUT_MS = 4000
const RESULTS_LIMIT = 8

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) ?? {}
  const query = String(body.query ?? '').trim()

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
