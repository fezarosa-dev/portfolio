import { createClient } from '@/lib/supabase/server'
import { embedTextSafe } from '@/lib/search/embed'

const MATCH_COUNT = 8

export type SearchResult = {
  id: string
  sourceTable: string
  sourceId: string
  title: string
  excerpt: string
  url: string
}

type SearchIndexRow = {
  id: string
  source_table: string
  source_id: string
  title: string
  excerpt: string
  url: string
}

function mapRow(row: SearchIndexRow): SearchResult {
  return {
    id: row.id,
    sourceTable: row.source_table,
    sourceId: row.source_id,
    title: row.title,
    excerpt: row.excerpt,
    url: row.url,
  }
}

export async function searchFullText(query: string): Promise<SearchResult[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('search_index_fulltext', {
    query_text: query,
    match_count: MATCH_COUNT,
  })
  if (error) throw error
  return (data as SearchIndexRow[]).map(mapRow)
}

export async function searchSemantic(query: string): Promise<SearchResult[] | null> {
  const embedding = await embedTextSafe(query)
  if (!embedding) return null

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('match_search_index', {
    query_embedding: embedding,
    match_count: MATCH_COUNT,
  })
  if (error) throw error
  return (data as SearchIndexRow[]).map(mapRow)
}
