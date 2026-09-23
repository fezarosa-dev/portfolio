import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

// bypassa RLS — só pra rotas de servidor que não têm sessão de cookie (ex.: o
// endpoint MCP, autenticado por token próprio em vez do login do Supabase Auth).
// Nunca usar num contexto que recebe input direto de um client não confiável
// sem checar permissão na aplicação antes, já que aqui não tem RLS de proteção.
export function createServiceClient(): SupabaseClient {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada — necessária para o servidor MCP.')
  }
  client = createClient(url, key, { auth: { persistSession: false } })
  return client
}
