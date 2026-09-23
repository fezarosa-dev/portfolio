import { createServiceClient } from '@/lib/supabase/service'
import { hashToken } from './tokens'
import type { McpPermissions } from './resources'

export type McpConnectionAuth = {
  id: string
  nickname: string
  permissions: McpPermissions
}

export async function authenticateMcpToken(token: string): Promise<McpConnectionAuth | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('mcp_connections')
    .select('id, nickname, status, permissions')
    .eq('token_hash', hashToken(token))
    .maybeSingle()
  if (error || !data || data.status !== 'active') return null

  // best-effort — não precisa bloquear a resposta por causa disso
  void supabase
    .from('mcp_connections')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})

  return { id: data.id, nickname: data.nickname, permissions: data.permissions as McpPermissions }
}
