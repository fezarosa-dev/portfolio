import { NextResponse } from 'next/server'
import { countRecentSearchesFromIp, logSearchRequest } from '@/lib/supabase/queries'
import { getLanguages, getSiteContent, getVisibleProjects } from '@/lib/supabase/queries-cached'
import { searchFullText, searchSemantic, type SearchResult } from '@/lib/supabase/search-queries'
import { reciprocalRankFusion } from '@/lib/search/rank'
import { cleanQuery, matchTechs, wantsProjects } from '@/lib/search/intent'
import { clientIp, isSameOriginJson } from '@/lib/request-guard'

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
  if (!isSameOriginJson(request)) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 403 })
  }
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

  const ip = clientIp(request)
  const recentCount = await countRecentSearchesFromIp(ip, RATE_LIMIT_WINDOW_MINUTES)
  if (recentCount >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: 'Muitas buscas em pouco tempo. Tente de novo em instantes.' },
      { status: 429 }
    )
  }
  await logSearchRequest(ip)

  // "projetos com python": se a busca cita tecnologias cadastradas, os projetos que realmente usam
  // elas vêm primeiro (vínculo do admin), antes de qualquer correspondência por texto
  const searchQuery = cleanQuery(query)
  const [languages, projects] = await Promise.all([getLanguages(), getVisibleProjects()]).catch(() => [[], []])
  const techs = matchTechs(query, languages)
  const techHits: SearchResult[] = []
  const techEntries: SearchResult[] = techs.map((tech) => ({
    id: `language-${tech.id}`,
    sourceTable: 'languages',
    sourceId: tech.id,
    title: tech.name,
    excerpt: '',
    url: `/projetos?tech=${tech.id}`,
  }))
  if (techs.length) {
    const ids = new Set(techs.map((tech) => tech.id))
    const score = (project: (typeof projects)[number]) => project.languages.filter((l) => ids.has(l.id)).length
    const matched = projects.filter((project) => score(project) > 0)
    const best = Math.max(0, ...matched.map(score))
    for (const project of matched.filter((p) => score(p) === best)) {
      techHits.push({
        id: `project-${project.id}`,
        sourceTable: 'projects',
        sourceId: project.id,
        title: project.title ?? project.title_en ?? 'Projeto',
        excerpt: project.summary ?? project.summary_en ?? '',
        url: project.click_mode === 'link' && project.click_url ? project.click_url : `/projetos/${project.id}`,
      })
    }
    if (techHits.length && wantsProjects(query)) {
      return NextResponse.json({ results: techHits.slice(0, RESULTS_LIMIT) })
    }
  }

  let fullTextResults, semanticResults
  try {
    ;[fullTextResults, semanticResults] = await Promise.all([
      searchFullText(searchQuery),
      withTimeout(searchSemantic(searchQuery).catch(() => null), SEMANTIC_TIMEOUT_MS),
    ])
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar.' }, { status: 500 })
  }

  // tecnologia por similaridade semântica só traz ruído (VBA em "simulador"); por nome o full-text já acha
  const semantic = semanticResults?.filter((hit) => hit.sourceTable !== 'languages')
  const fused = semantic ? reciprocalRankFusion(fullTextResults, semantic) : fullTextResults
  const pinned = [...techEntries, ...techHits]
  const seen = new Set(pinned.map((hit) => hit.sourceId))
  const results = [...pinned, ...fused.filter((hit) => !seen.has(hit.sourceId))]

  return NextResponse.json({ results: results.slice(0, RESULTS_LIMIT) })
}
