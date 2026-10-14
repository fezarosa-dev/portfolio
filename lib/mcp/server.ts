import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidateTag } from 'next/cache'
import { registerMcpTools } from './tools'
import type { McpConnectionAuth } from './auth'

// tools que gravam: depois delas o cache público ('site') é invalidado na hora, como no admin
const WRITE_TOOL = /^(upsert|delete|set|mover|marcar|importar|ordenar)_/

export function buildMcpServer(auth: McpConnectionAuth, client: SupabaseClient): McpServer {
  const server = new McpServer(
    { name: 'zanoni-portfolio', version: '1.0.0' },
    {
      instructions: `Conexão "${auth.nickname}" com o site zanoni.dev.br. Comece por get_template_site (guia geral: o que existe, qual tool edita cada coisa, como mostrar/esconder). Use as tools disponíveis pra ler e editar o conteúdo do site, dentro das permissões concedidas a esta conexão no painel admin.`,
    }
  )
  const register = server.registerTool.bind(server) as (name: string, config: unknown, cb: (...args: unknown[]) => Promise<unknown>) => unknown
  // ponytail: wrapper por nome; vira flag explícita se alguma tool de escrita fugir do padrão de prefixo
  ;(server as unknown as { registerTool: typeof register }).registerTool = (name, config, cb) =>
    register(name, config, async (...args) => {
      const result = await cb(...args)
      if (WRITE_TOOL.test(name)) revalidateTag('site', { expire: 0 })
      return result
    })
  registerMcpTools(server, auth.permissions, client)
  return server
}
