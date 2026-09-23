import { createClient } from '@/lib/supabase/server'
import { generateToken, hashToken } from './tokens'
import type { McpPermissions } from './resources'

export type McpConnection = {
  id: string
  nickname: string
  status: 'active' | 'revoked'
  permissions: McpPermissions
  created_at: string
  last_used_at: string | null
}

const SELECT_FIELDS = 'id, nickname, status, permissions, created_at, last_used_at'

export async function listMcpConnections(): Promise<McpConnection[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mcp_connections')
    .select(SELECT_FIELDS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as McpConnection[]
}

export async function createMcpConnection(
  nickname: string,
  permissions: McpPermissions
): Promise<{ connection: McpConnection; token: string }> {
  const token = generateToken()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mcp_connections')
    .insert({ nickname: nickname.trim(), permissions, token_hash: hashToken(token) })
    .select(SELECT_FIELDS)
    .single()
  if (error) throw error
  return { connection: data as McpConnection, token }
}

export async function renameMcpConnection(id: string, nickname: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('mcp_connections').update({ nickname: nickname.trim() }).eq('id', id)
  if (error) throw error
}

export async function setMcpConnectionStatus(id: string, status: 'active' | 'revoked'): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('mcp_connections').update({ status }).eq('id', id)
  if (error) throw error
}

export async function setMcpConnectionPermissions(id: string, permissions: McpPermissions): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('mcp_connections').update({ permissions }).eq('id', id)
  if (error) throw error
}

export async function deleteMcpConnection(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('mcp_connections').delete().eq('id', id)
  if (error) throw error
}
