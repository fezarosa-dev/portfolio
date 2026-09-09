import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase anon, sem cookies e sem sessão persistida. Leituras
 * públicas passam pela RLS com a anon key — não precisam do client de
 * `@supabase/ssr` (que lê `cookies()` e não pode ser chamado dentro de
 * `unstable_cache`).
 */
export function createPublicClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
