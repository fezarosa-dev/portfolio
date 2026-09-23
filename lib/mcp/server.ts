import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { registerMcpTools } from './tools'
import type { McpConnectionAuth } from './auth'

export function buildMcpServer(auth: McpConnectionAuth, client: SupabaseClient): McpServer {
  const server = new McpServer(
    { name: 'zanoni-portfolio', version: '1.0.0' },
    {
      instructions: `Conexão "${auth.nickname}" com o site zanoni.dev.br. Use as tools disponíveis pra ler e editar o conteúdo do site, dentro das permissões concedidas a esta conexão no painel admin.`,
    }
  )
  registerMcpTools(server, auth.permissions, client)
  return server
}
